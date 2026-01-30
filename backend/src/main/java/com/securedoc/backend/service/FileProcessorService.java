package com.securedoc.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.securedoc.backend.client.ClipClient;
import com.securedoc.backend.client.TikaClient;
import com.securedoc.backend.client.WhisperClient;
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
import com.securedoc.backend.utils.ByteArrayMultipartFile;
import com.securedoc.backend.utils.CryptoUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileProcessorService {

    private final FilePageRepository filePageRepository;
    private final CoreFileService coreFileService;
    private final CryptoUtils cryptoUtils;
    private final DocxConverterService docxConverterService;
    private final GridFsTemplate gridFsTemplate;
    private final FileNodeRepository fileNodeRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PageIndexRepository pageIndexRepository;
    private final DocumentIndexService documentIndexService;
    private final ObjectMapper objectMapper;

    // Các Client AI
    private final TikaClient tikaClient;
    private final ClipClient clipClient;
    private final WhisperClient whisperClient;

    /**
     * WORKER CHÍNH: Xử lý toàn bộ quy trình sau khi upload
     * Đây là điểm vào duy nhất (Entry Point) được gọi từ FileStorageService
     */
    @Async
    public void processFileAsync(FileNode fileNode, SecretKey fileKey) {
        String userId = fileNode.getOwnerId();
        log.info(">>> START ASYNC PROCESSING: {}", fileNode.getName());

        try {
            // 1. Tải và giải mã file từ GridFS
            byte[] fileData = downloadAndDecryptToBytes(fileNode, fileKey);

            // 2. DETECT MIME TYPE (Dùng Tika Client để chính xác nhất)
            String detectedMime = tikaClient.detectMimeType(fileData);
            log.info("Detected Mime: {}", detectedMime);

            // Cập nhật lại MimeType chuẩn vào Entity
            fileNode.setMimeType(detectedMime);

            String extractedText = "";
            float[] imageVector = null;

            // 3. PHÂN LUỒNG XỬ LÝ (ROUTING)

            // --- CASE A: FILE ẢNH (OCR + CLIP) ---
            if (detectedMime.startsWith("image/")) {
                // A1. OCR lấy Text (Dùng Tika)
                try {
                    String rawTika = tikaClient.parseToString(fileData);
                    extractedText = extractTextFromTika(rawTika);
                } catch (Exception e) {
                    log.warn("OCR Failed for image {}: {}", fileNode.getId(), e.getMessage());
                }

                // A2. CLIP lấy Vector
                try {
                    String base64Img = Base64.getEncoder().encodeToString(fileData);
                    String imageUrl = "data:image/png;base64," + base64Img;

                    ClipClient.JinaInput input = ClipClient.JinaInput.builder()
                            .uri(imageUrl)
                            .build();

                    ClipClient.JinaRequest req = ClipClient.JinaRequest.builder()
                            .data(List.of(input))
                            .build();

                    imageVector = clipClient.embed(req).getData().get(0).getEmbedding();
                } catch (Exception e) {
                    log.error("CLIP Embedding Failed: {}", e.getMessage());
                }
            }

            // --- CASE B: VIDEO / AUDIO (WHISPER) ---
            else if (detectedMime.startsWith("video/") || detectedMime.startsWith("audio/")) {
                try {
                    // Giả lập MultipartFile để gửi qua Feign
                    ByteArrayMultipartFile multipartFile = new ByteArrayMultipartFile(
                            fileData, "file", fileNode.getName(), detectedMime
                    );
                    // Gọi Whisper (trả về text) - Không cần dense_vector
                    extractedText = whisperClient.transcribe(multipartFile, "small", "vi").getText();
                } catch (Exception e) {
                    log.error("Whisper Failed: {}", e.getMessage());
                }
            }

            // --- CASE C: VĂN BẢN (PDF / DOC / DOCX) ---
            else if (isDocument(detectedMime) || isDocumentByName(fileNode.getName())) {
                // C1. Lấy Text toàn bộ (để index vào field 'content' của file chính)
                String rawTika = tikaClient.parseToString(fileData);
                extractedText = extractTextFromTika(rawTika);

                // C2. CHẠY LOGIC TÁCH TRANG CŨ (Preview & Page Indexing)
                // Gọi hàm nội bộ, truyền byte[] đã tải để không phải tải lại
                try {
                    processDocumentPages(fileNode, fileData, fileKey);
                } catch (Exception e) {
                    log.error("Error splitting pages: {}", e.getMessage());
                    // Không throw exception để vẫn tiếp tục index file chính
                }
            }

            // --- CASE D: TEXT KHÁC (TXT, HTML...) ---
            else {
                String rawTika = tikaClient.parseToString(fileData);
                extractedText = extractTextFromTika(rawTika);
            }

            // 4. LƯU ELASTICSEARCH (Index File Chính)
            // Gọi hàm mới 3 tham số (đã sửa ở DocumentIndexService)
            documentIndexService.updateContentAndVectors(
                    fileNode.getId(),
                    extractedText, // Text từ Tika/OCR/Whisper
                    imageVector    // Vector từ Clip (hoặc null)
            );

            // 5. HOÀN TẤT & THÔNG BÁO
            fileNode.setStatus(EFileStatus.AVAILABLE);
            fileNodeRepository.save(fileNode);

            // Gửi Socket thông báo cho User
            FileStatusMessage message = new FileStatusMessage(fileNode.getId(), "AVAILABLE", fileNode.getName());
            messagingTemplate.convertAndSend("/topic/files/" + userId, message);

            log.info("<<< PROCESSING DONE: {}", fileNode.getName());

        } catch (Exception e) {
            log.error("Error processing file {}: {}", fileNode.getId(), e.getMessage());

            // Xử lý LỖI
            fileNode.setStatus(EFileStatus.FAILED);
            fileNode.setErrorMessage(e.getMessage());
            fileNodeRepository.save(fileNode);

            // Notify lỗi
            FileStatusMessage message = new FileStatusMessage(fileNode.getId(), "FAILED", fileNode.getName());
            messagingTemplate.convertAndSend("/topic/files/" + userId, message);
        }
    }

    /**
     * LOGIC CŨ: Tách trang, Render ảnh mờ/rõ, Lưu PageIndex
     * Đã được refactor để nhận byte[] trực tiếp (tránh tải lại file).
     */
    private void processDocumentPages(FileNode fileNode, byte[] fileData, SecretKey fileKey) throws Exception {
        log.info(">>> Processing Document Pages for: {}", fileNode.getName());

        // 1. CHUẨN BỊ DỮ LIỆU PDF
        byte[] pdfBytes;
        // Check kỹ hơn bằng cả mime và extension
        boolean isWord = fileNode.getMimeType().contains("word")
                || fileNode.getMimeType().contains("officedocument")
                || isDocx(fileNode.getName());

        if (isWord) {
            pdfBytes = docxConverterService.convertDocxToPdf(fileData);
        } else if (fileNode.getMimeType().contains("pdf")) {
            pdfBytes = fileData;
        } else {
            return; // Không hỗ trợ tách trang cho loại khác
        }

        // 2. XỬ LÝ TÁCH TRANG
        try (PDDocument document = PDDocument.load(pdfBytes)) {
            PDFRenderer pdfRenderer = new PDFRenderer(document);
            PDFTextStripper textStripper = new PDFTextStripper();

            int totalPages = document.getNumberOfPages();
            log.info("Total pages to split: {}", totalPages);

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
    }

    /**
     * Xử lý 1 trang duy nhất: Render -> Blur -> Encrypt -> Save DB
     */
    private PageIndex processSinglePage(FileNode fileNode, PDDocument doc, PDFRenderer renderer, PDFTextStripper stripper, int pageIndex, SecretKey sharedKey) throws Exception {
        // A. Render & Save Ảnh Rõ
        BufferedImage clearImg = renderer.renderImageWithDPI(pageIndex, 150, ImageType.RGB);
        StoredFileResult clearResult = saveImageWithKey(clearImg, "p_clear.jpg", sharedKey);

        // B. Render & Save Ảnh Mờ
        int blockSize = 35;
        BufferedImage blurredImg = pixelateWithThumbnails(clearImg, blockSize);
        StoredFileResult blurredResult = saveImageWithKey(blurredImg, "p_blur.jpg", sharedKey);

        // C. Trích xuất Text trang đó
        stripper.setStartPage(pageIndex + 1);
        stripper.setEndPage(pageIndex + 1);
        String text = stripper.getText(doc);

        // D. Lưu FilePage (MongoDB)
        FilePage page = FilePage.builder()
                .fileId(fileNode.getId())
                .pageIndex(pageIndex)
                .isLocked(false)
                .width(clearImg.getWidth())
                .height(clearImg.getHeight())
                .content(text)
                .clearGridFsId(clearResult.getGridFsId())
                .clearEncryptionData(new FileNode.EncryptionMetadata(
                        "AES/GCM/NoPadding",
                        cryptoUtils.encodeBase64(clearResult.getIv()),
                        null // KeyId = NULL (Dùng key file cha)
                ))
                .blurredGridFsId(blurredResult.getGridFsId())
                .blurredEncryptionData(new FileNode.EncryptionMetadata(
                        "AES/GCM/NoPadding",
                        cryptoUtils.encodeBase64(blurredResult.getIv()),
                        null
                ))
                .build();

        FilePage savedPage = filePageRepository.save(page);

        // E. Trả về PageIndex (Elasticsearch)
        // Lưu ý: Không lưu vector cho trang (theo yêu cầu tối giản)
        return PageIndex.builder()
                .id(savedPage.getId())
                .fileId(fileNode.getId())
                .pageIndex(pageIndex)
                .content(text)
                .fileName(fileNode.getName())
                .ownerId(fileNode.getOwnerId())
                .ancestors(fileNode.getAncestors())
                .build();
    }

    // --- HELPER METHODS ---

    private byte[] downloadAndDecryptToBytes(FileNode fileNode, SecretKey fileKey) throws Exception {
        GridFSFile gridFSFile = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(fileNode.getGridFsId())));
        if (gridFSFile == null) throw new AppException(AppErrorCode.GRIDFS_FILE_NOT_FOUND);

        byte[] iv = cryptoUtils.decodeBase64(fileNode.getEncryptionMetadata().getIv());
        GridFsResource resource = gridFsTemplate.getResource(gridFSFile);

        try (InputStream encryptedStream = resource.getInputStream()) {
            Cipher decryptCipher = cryptoUtils.getDecryptCipher(fileKey, iv);
            try (CipherInputStream decryptedStream = new CipherInputStream(encryptedStream, decryptCipher)) {
                return decryptedStream.readAllBytes();
            }
        }
    }

    private StoredFileResult saveImageWithKey(BufferedImage image, String name, SecretKey key) throws Exception {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", os);
        InputStream is = new ByteArrayInputStream(os.toByteArray());
        return coreFileService.storeWithExistingKey(is, name, "image/jpeg", key);
    }

    public static BufferedImage pixelateWithThumbnails(BufferedImage src, int blockSize) throws IOException {
        int width = src.getWidth();
        int height = src.getHeight();
        int smallW = Math.max(1, width / blockSize);
        int smallH = Math.max(1, height / blockSize);

        BufferedImage tiny = Thumbnails.of(src).size(smallW, smallH).asBufferedImage();
        BufferedImage pixelated = Thumbnails.of(tiny).size(width, height).outputQuality(0.85).asBufferedImage();
        return pixelated;
    }

    private boolean isDocx(String name) {
        return name != null && name.toLowerCase().endsWith(".docx");
    }

    private boolean isDocument(String mime) {
        return mime.contains("pdf") || mime.contains("word") || mime.contains("officedocument");
    }

    private boolean isDocumentByName(String name) {
        return name != null && (name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx"));
    }

    private String extractTextFromTika(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) return "";
        try {
            // 1. Thử đọc xem có phải JSON không
            JsonNode root = objectMapper.readTree(rawResponse);

            // 2. Nếu là JSON, kiểm tra field content
            if (root.has("X-TIKA:content")) {
                String content = root.get("X-TIKA:content").asText();
                return content != null ? content.trim() : "";
            }

            // 3. Là JSON nhưng không có field content -> Trả về rỗng
            return "";

        } catch (Exception e) {
            // 4. Lỗi parse (nghĩa là rawResponse là XML rác hoặc text thường nhưng user yêu cầu trả rỗng nếu lỗi)
            return "";
        }
    }
}