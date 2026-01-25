package com.securedoc.backend.service;

import com.mongodb.client.gridfs.model.GridFSFile;
import com.securedoc.backend.dto.internal.StoredFileResult;
import com.securedoc.backend.dto.notification.FileStatusMessage;
import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.entity.FilePage;
import com.securedoc.backend.entity.elasticsearch.PageIndex;
import com.securedoc.backend.enums.EFileStatus;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.repository.FileNodeRepository;
import com.securedoc.backend.repository.FilePageRepository;
import com.securedoc.backend.repository.elasticsearch.PageIndexRepository;
import com.securedoc.backend.service.elasticsearch.DocumentIndexService;
import com.securedoc.backend.utils.CryptoUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.SecretKey;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileProcessorService {

    private final FilePageRepository filePageRepository;
    private final CoreFileService coreFileService;
    private final CryptoUtils cryptoUtils;
    private final DocxConverterService docxConverterService; // <--- INJECT MỚI
    private final GridFsTemplate gridFsTemplate;
    private final FileNodeRepository fileNodeRepository; // Inject thêm để update status DB
    private final SimpMessagingTemplate messagingTemplate; // [MỚI] Inject cái này để bắn Socket
    private final PageIndexRepository pageIndexRepository;
    private final DocumentIndexService documentIndexService;

    /**
     * Phiên bản tối ưu: Không nhận byte[] fileData nữa.
     * Tự tải từ GridFS -> Tiết kiệm RAM cho Main Thread.
     */
    @Async
    public void processFilePages(FileNode fileNode, SecretKey fileKey) {
        String userId = fileNode.getOwnerId();
        log.info(">>> BẮT ĐẦU XỬ LÝ BACKGROUND: Tách trang cho file '{}'", fileNode.getName());
        try {
            // 1. TỰ TẢI VÀ GIẢI MÃ NỘI DUNG TỪ GRIDFS
            // (Hàm này logic giống hệt getDecryptedBytes nhưng nằm ở service này)
            byte[] fileData = downloadAndDecryptToBytes(fileNode, fileKey);

            // 2. CHUẨN BỊ DỮ LIỆU PDF
            byte[] pdfBytes;
            if (isDocx(fileNode.getName()) || fileNode.getMimeType().contains("word") || fileNode.getMimeType().contains("officedocument")) {
                pdfBytes = docxConverterService.convertDocxToPdf(fileData);
            } else if (fileNode.getMimeType().equals("application/pdf")) {
                pdfBytes = fileData;
            } else {
                return;
            }

            // 3. XỬ LÝ TÁCH TRANG (Giữ nguyên logic cũ)
            try (PDDocument document = PDDocument.load(pdfBytes)) {
                PDFRenderer pdfRenderer = new PDFRenderer(document);
                PDFTextStripper textStripper = new PDFTextStripper();

                int totalPages = document.getNumberOfPages();
                log.info("Tổng số trang cần xử lý: {}", totalPages);

                List<PageIndex> esPages = new ArrayList<>();
                for (int i = 0; i < totalPages; i++) {
                    PageIndex esPage = processSinglePage(fileNode, document, pdfRenderer, textStripper, i, fileKey);
                    if (esPage != null) {
                        esPages.add(esPage);
                    }
                }

                if (!esPages.isEmpty()) {
                    pageIndexRepository.saveAll(esPages);
                }
            }
            log.info("<<< HOÀN TẤT XỬ LÝ: {}", fileNode.getName());

            // -----------------------------------------------------------
            // KHI XỬ LÝ THÀNH CÔNG
            // -----------------------------------------------------------

            // 1. Cập nhật trạng thái trong DB
            fileNode.setStatus(EFileStatus.AVAILABLE);
            FileNode savedNode = fileNodeRepository.save(fileNode);

            documentIndexService.updateElasticsearchStatus(savedNode);

            // 2. Gửi WebSocket thông báo cho User
            // Topic: /topic/files/{userId} -> Chỉ user đó nghe được
            FileStatusMessage message = new FileStatusMessage(fileNode.getId(), "AVAILABLE", fileNode.getName());

            messagingTemplate.convertAndSend("/topic/files/" + userId, message);

            log.info("Done & Notified user {}", userId);

        } catch (Exception e) {
            log.error("Lỗi xử lý file async {}: {}", fileNode.getId(), e.getMessage());
            // 3. Xử lý khi LỖI
            fileNode.setStatus(EFileStatus.FAILED); // Giả sử bạn có status FAILED
            FileNode savedNode = fileNodeRepository.save(fileNode);

            documentIndexService.updateElasticsearchStatus(savedNode);

            FileStatusMessage message = new FileStatusMessage(fileNode.getId(), "FAILED", fileNode.getName());
            messagingTemplate.convertAndSend("/topic/files/" + userId, message);
        }
    }

    // Helper: Tải và giải mã (Copy logic từ StorageService sang hoặc public hàm ở StorageService để gọi)
    private byte[] downloadAndDecryptToBytes(FileNode fileNode, SecretKey fileKey) throws Exception {
        GridFSFile gridFSFile = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(fileNode.getGridFsId())));
        if (gridFSFile == null) throw new AppException(AppErrorCode.GRIDFS_FILE_NOT_FOUND);

        // Lấy IV từ metadata
        byte[] iv = cryptoUtils.decodeBase64(fileNode.getEncryptionMetadata().getIv());

        GridFsResource resource = gridFsTemplate.getResource(gridFSFile);
        try (InputStream encryptedStream = resource.getInputStream()) {
            Cipher decryptCipher = cryptoUtils.getDecryptCipher(fileKey, iv);
            try (CipherInputStream decryptedStream = new CipherInputStream(encryptedStream, decryptCipher)) {
                return decryptedStream.readAllBytes();
            }
        }
    }

    /**
     * Xử lý 1 trang duy nhất: Render -> Blur -> Encrypt -> Save DB
     */
    private PageIndex processSinglePage(FileNode fileNode, PDDocument doc, PDFRenderer renderer, PDFTextStripper stripper, int pageIndex, SecretKey sharedKey) throws Exception {
        // A. Render & Save Ảnh Rõ (Dùng Shared Key)
        BufferedImage clearImg = renderer.renderImageWithDPI(pageIndex, 150, ImageType.RGB);
        StoredFileResult clearResult = saveImageWithKey(clearImg, "p_clear.jpg", sharedKey);

        // B. Render & Save Ảnh Mờ (Dùng Shared Key)
        int blockSize = 35; // thử 20, 35, 50 để thấy mức mờ khác nhau
        BufferedImage blurredImg = pixelateWithThumbnails(clearImg, blockSize);
        StoredFileResult blurredResult = saveImageWithKey(blurredImg, "p_blur.jpg", sharedKey);

        // C. Trích xuất Text
        stripper.setStartPage(pageIndex + 1);
        stripper.setEndPage(pageIndex + 1);
        String text = stripper.getText(doc);

        // D. Lưu FilePage (KHÔNG CẦN SỬA FileNode hay EncryptionMetadata inner class)
        // Ta sử dụng lại lớp FileNode.EncryptionMetadata cũ.
        // Trường keyId để null -> Ngầm hiểu là lấy từ cha.
        FilePage page = FilePage.builder()
                .fileId(fileNode.getId())
                .pageIndex(pageIndex)
                .isLocked(false)
                .width(clearImg.getWidth())
                .height(clearImg.getHeight())
                .content(text)

                // Metadata Ảnh Rõ
                .clearGridFsId(clearResult.getGridFsId())
                .clearEncryptionData(new FileNode.EncryptionMetadata(
                        "AES/GCM/NoPadding",
                        cryptoUtils.encodeBase64(clearResult.getIv()),
                        null // KeyId = NULL (Vì dùng key của file cha)
                ))

                // Metadata Ảnh Mờ
                .blurredGridFsId(blurredResult.getGridFsId())
                .blurredEncryptionData(new FileNode.EncryptionMetadata(
                        "AES/GCM/NoPadding",
                        cryptoUtils.encodeBase64(blurredResult.getIv()),
                        null // KeyId = NULL
                ))
                .build();

        FilePage savedPage = filePageRepository.save(page);

        return PageIndex.builder()
                .id(savedPage.getId()) // [QUAN TRỌNG] Mapping ID
                .fileId(fileNode.getId())
                .pageIndex(pageIndex)
                .content(text)
                // Copy thông tin từ FileNode sang để phục vụ Search Security
                .fileName(fileNode.getName())
                .ownerId(fileNode.getOwnerId())
                .ancestors(fileNode.getAncestors())
                .allowedUsers(null) // Hoặc logic share của bạn
                .build();
    }

    // Hàm helper gọi CoreService mới
    private StoredFileResult saveImageWithKey(BufferedImage image, String name, SecretKey key) throws Exception {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", os);
        InputStream is = new ByteArrayInputStream(os.toByteArray());
        return coreFileService.storeWithExistingKey(is, name, "image/jpeg", key);
    }

    public static BufferedImage pixelateWithThumbnails(BufferedImage src, int blockSize) throws IOException {
        int width = src.getWidth();
        int height = src.getHeight();

        // tính kích thước cực nhỏ: mỗi chiều còn khoảng width/blockSize pixel
        int smallW = Math.max(1, width / blockSize);
        int smallH = Math.max(1, height / blockSize);

        // 1) thu nhỏ cực mạnh
        BufferedImage tiny = Thumbnails.of(src)
                .size(smallW, smallH)
                .asBufferedImage();

        // 2) phóng lại về kích thước gốc (kết quả sẽ "mờ/khối")
        BufferedImage pixelated = Thumbnails.of(tiny)
                .size(width, height)
                // có thể kết hợp giảm chất lượng nén nữa nếu muốn thêm lossiness
                .outputQuality(0.85) // giữ tương đối; bạn có thể giảm xuống 0.6 hoặc 0.3
                .asBufferedImage();

        return pixelated;
    }

    private boolean isDocx(String name) {
        return name != null && name.toLowerCase().endsWith(".docx");
    }
}