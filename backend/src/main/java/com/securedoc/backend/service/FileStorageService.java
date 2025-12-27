package com.securedoc.backend.service;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.securedoc.backend.dto.file.*;
import com.securedoc.backend.entity.FileKey;
import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.entity.User;
import com.securedoc.backend.entity.elasticsearch.DocumentIndex;
import com.securedoc.backend.enums.EFileStatus;
import com.securedoc.backend.enums.EFileType;
import com.securedoc.backend.enums.EPublicAccess;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.repository.FileKeyRepository;
import com.securedoc.backend.repository.FileNodeRepository;
import com.securedoc.backend.repository.UserRepository;
import com.securedoc.backend.repository.elasticsearch.DocumentIndexRepository;
import com.securedoc.backend.utils.CryptoUtils;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.bson.types.ObjectId;
import org.modelmapper.ModelMapper;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.SecretKey;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final FileNodeRepository fileNodeRepository;
    private final DocumentIndexRepository documentIndexRepository;
    private final FileKeyRepository fileKeyRepository;
    private final RecentFileService recentFileService;
    private final FileShareService fileShareService;
    private final UserRepository userRepository;

    private final ModelMapper modelMapper;
    private final GridFsTemplate gridFsTemplate;
    private final CryptoUtils cryptoUtils;
    private final Tika tika;

    /**
     * 1. HÀM DÙNG CHUNG: KIỂM TRA QUYỀN & LẤY THÔNG TIN THỪA KẾ
     * - Check tồn tại folder cha
     * - Check quyền User
     * - Lấy Ancestors, Permissions
     */
    private FolderContext getParentContext(String parentId, String userId) {
        if (parentId == null) {
            // Nếu là Root: không có ancestors, quyền private mặc định
            return FolderContext.builder()
                    .parentId(null)
                    .ancestors(new ArrayList<>())
                    .publicAccess(EPublicAccess.PRIVATE)
                    .permissions(new ArrayList<>())
                    .build();
        }

        FileNode parent = fileNodeRepository.findByIdAndIsDeletedFalse(parentId)
                .orElseThrow(() -> new AppException(AppErrorCode.PARENT_NOT_FOUND));

        if (parent.getType() != EFileType.FOLDER) {
            throw new AppException(AppErrorCode.PARENT_IS_NOT_FOLDER);
        }

        // Security Check
        if (!fileShareService.hasEditAccess(parent, userId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        // Logic thừa kế
        List<String> ancestors = new ArrayList<>(parent.getAncestors());
        ancestors.add(parent.getId());

        List<FileNode.FilePermission> perms = parent.getPermissions() != null
                ? new ArrayList<>(parent.getPermissions())
                : new ArrayList<>();

        return FolderContext.builder()
                .parentId(parent.getId())
                .ancestors(ancestors)
                .publicAccess(parent.getPublicAccess())
                .permissions(perms)
                .build();
    }

    /**
     * 2. HÀM DÙNG CHUNG: XỬ LÝ TÊN FILE (TỰ ĐỔI TÊN NẾU TRÙNG)
     */
    private String generateUniqueFileName(String parentId, String originalName) {
        String finalName = originalName;
        String baseName = originalName;
        String extension = "";

        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex >= 0) {
            baseName = originalName.substring(0, dotIndex);
            extension = originalName.substring(dotIndex);
        }

        int count = 1;
        while (fileNodeRepository.existsByParentIdAndNameAndIsDeletedFalse(parentId, finalName)) {
            finalName = baseName + " (" + count + ")" + extension;
            count++;
        }
        return finalName;
    }

    /**
     * 3. HÀM DÙNG CHUNG: XỬ LÝ LƯU FILE CỐT LÕI (CORE)
     * - Không check quyền (vì đã check ở ngoài)
     * - Xử lý Tika, Encryption, GridFS, Mongo Save
     */
    private FileResponse processFileSave(MultipartFile file, String fileName, FolderContext context, String userId, String description) throws Exception {
        // --- TIKA & EXTRACT CONTENT ---
        String realMimeType;
        try (InputStream stream = file.getInputStream()) {
            realMimeType = tika.detect(stream);
        }
        String extractedContent = "";
        try (InputStream stream = file.getInputStream()) {
            extractedContent = tika.parseToString(stream);
        } catch (Exception e) { /* log ignored */ }

        // --- ENCRYPTION & GRIDFS ---
        SecretKey fileKey = cryptoUtils.generateSecretKey();
        byte[] iv = cryptoUtils.generateIV();
        Cipher encryptCipher = cryptoUtils.getEncryptCipher(fileKey, iv);

        InputStream fileStream = file.getInputStream();
        CipherInputStream encryptedStream = new CipherInputStream(fileStream, encryptCipher);

        // Lưu vào GridFS
        Object gridFsId = gridFsTemplate.store(encryptedStream, fileName, realMimeType);

        // --- SAVE ENTITY ---
        FileNode fileNode = FileNode.builder()
                .name(fileName)
                .description(description)
                .type(EFileType.FILE)
                .parentId(context.getParentId())
                .ancestors(context.getAncestors())
                .size(file.getSize())
                .mimeType(realMimeType)
                .extension(getExt(fileName))
                .gridFsId(gridFsId.toString())
                .ownerId(userId)
                .status(EFileStatus.AVAILABLE)
                .isEncrypted(true)
                .isDeleted(false)
                .publicAccess(context.getPublicAccess())
                .permissions(context.getPermissions())
                .encryptionMetadata(new FileNode.EncryptionMetadata("AES/GCM/NoPadding", cryptoUtils.encodeBase64(iv), null))
                .build();

        FileNode savedNode = fileNodeRepository.save(fileNode);

        // Save Key
        FileKey keyEntity = FileKey.builder()
                .fileNodeId(savedNode.getId())
                .algorithm("AES")
                .encryptedKey(cryptoUtils.encryptFileKey(fileKey))
                .masterKeyVersion(1)
                .build();
        FileKey savedKey = fileKeyRepository.save(keyEntity);

        savedNode.getEncryptionMetadata().setKeyId(savedKey.getId());
        fileNodeRepository.save(savedNode);

        saveToElasticsearch(savedNode, extractedContent);

        return modelMapper.map(savedNode, FileResponse.class);
    }

    // =========================================================================
    // CÁC HÀM PUBLIC (SERVICE METHODS)
    // =========================================================================

    /**
     * CREATE FOLDER
     */
    @Transactional
    public FileResponse createFolder(FolderCreateRequest request, String userId) {
        // 1. Lấy context cha (đã bao gồm check quyền)
        FolderContext context = getParentContext(request.getParentId(), userId);

        // 2. Check trùng tên Folder
        if (fileNodeRepository.existsByParentIdAndNameAndIsDeletedFalse(context.getParentId(), request.getName())) {
            throw new AppException(AppErrorCode.FOLDER_NAME_EXISTED);
        }

        // 3. Tạo Folder
        FileNode folder = FileNode.builder()
                .name(request.getName())
                .type(EFileType.FOLDER)
                .parentId(context.getParentId())
                .ancestors(context.getAncestors())
                .ownerId(userId)
                .status(EFileStatus.AVAILABLE)
                .isEncrypted(false)
                .isDeleted(false)
                .publicAccess(context.getPublicAccess())
                .permissions(context.getPermissions())
                .build();

        FileNode savedFolder = fileNodeRepository.save(folder);
        saveToElasticsearch(savedFolder);

        return modelMapper.map(savedFolder, FileResponse.class);
    }

    /**
     * UPLOAD BATCH (Đã chuyển logic từ Controller vào đây)
     */
    @Transactional
    public BatchUploadResponse uploadBatch(MultipartFile[] files, FileMetadataRequest metadata, String userId) {
        List<BatchUploadResponse.FileItemStatus> successList = new ArrayList<>();
        List<BatchUploadResponse.FileItemStatus> failList = new ArrayList<>();

        // 1. TỐI ƯU: Chỉ check quyền trên folder cha 1 lần duy nhất cho cả lô file
        FolderContext parentContext;
        try {
            parentContext = getParentContext(metadata.getParentId(), userId);
        } catch (Exception e) {
            // Nếu lỗi ngay từ bước check quyền cha, fail toàn bộ
            throw e;
        }

        // 2. Duyệt file và lưu
        for (MultipartFile file : files) {
            try {
                String originalName = file.getOriginalFilename();
                // Tự động đổi tên nếu trùng
                String uniqueName = generateUniqueFileName(parentContext.getParentId(), originalName);

                // Gọi hàm cốt lõi để lưu
                FileResponse response = processFileSave(file, uniqueName, parentContext, userId, metadata.getDescription());

                String msg = "Upload thành công";
                if (!uniqueName.equals(originalName)) {
                    msg = "Đã đổi tên thành: " + uniqueName;
                }
                successList.add(new BatchUploadResponse.FileItemStatus(originalName, msg, response));

            } catch (Exception e) {
                failList.add(new BatchUploadResponse.FileItemStatus(file.getOriginalFilename(), e.getMessage(), null));
            }
        }

        return BatchUploadResponse.builder()
                .totalFiles(files.length)
                .successCount(successList.size())
                .failCount(failList.size())
                .successfulFiles(successList)
                .failedFiles(failList)
                .build();
    }

    /**
     * UPLOAD FOLDER (Giữ nguyên cấu trúc cây)
     */
    @Transactional
    public BatchUploadResponse uploadFolder(MultipartFile[] files, String[] paths, FileMetadataRequest metadata, String userId) {
        if (files.length != paths.length) throw new AppException(AppErrorCode.INVALID_REQUEST);

        List<BatchUploadResponse.FileItemStatus> successList = new ArrayList<>();
        List<BatchUploadResponse.FileItemStatus> failList = new ArrayList<>();
        Map<String, FolderContext> contextCache = new HashMap<>(); // Cache Context thay vì chỉ ID

        // 1. Lấy context gốc (Root)
        FolderContext rootContext = getParentContext(metadata.getParentId(), userId);

        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            String relativePath = paths[i];

            try {
                String[] parts = relativePath.split("/");
                FolderContext currentContext = rootContext;

                // 2. Duyệt tạo folder con
                for (int j = 0; j < parts.length - 1; j++) {
                    String folderName = parts[j];
                    String cacheKey = (currentContext.getParentId() == null ? "ROOT" : currentContext.getParentId()) + "/" + folderName;

                    if (contextCache.containsKey(cacheKey)) {
                        currentContext = contextCache.get(cacheKey);
                    } else {
                        // Tạo folder mới hoặc lấy folder đã tồn tại
                        // Logic này tái sử dụng getOrCreateFolder nhưng trả về Context
                        FileNode folderNode = getOrCreateFolderNode(folderName, currentContext, userId);

                        // Tạo Context mới cho folder này
                        List<String> newAncestors = new ArrayList<>(folderNode.getAncestors());
                        newAncestors.add(folderNode.getId());

                        FolderContext newContext = FolderContext.builder()
                                .parentId(folderNode.getId())
                                .ancestors(newAncestors)
                                .publicAccess(folderNode.getPublicAccess()) // Thừa kế
                                .permissions(new ArrayList<>(folderNode.getPermissions())) // Thừa kế
                                .build();

                        contextCache.put(cacheKey, newContext);
                        currentContext = newContext;
                    }
                }

                // 3. Upload File
                String originalName = Paths.get(file.getOriginalFilename()).getFileName().toString();
                String uniqueName = generateUniqueFileName(currentContext.getParentId(), originalName);
                FileResponse response = processFileSave(file, uniqueName, currentContext, userId, "Uploaded from folder: " + relativePath);

                String msg = "Thành công";
                if (!uniqueName.equals(file.getOriginalFilename())) {
                    msg = "Đã đổi tên thành: " + uniqueName;
                }
                successList.add(new BatchUploadResponse.FileItemStatus(relativePath, msg, response));

            } catch (Exception e) {
                e.printStackTrace();
                failList.add(new BatchUploadResponse.FileItemStatus(relativePath, e.getMessage(), null));
            }
        }

        return BatchUploadResponse.builder()
                .totalFiles(files.length)
                .successCount(successList.size())
                .failCount(failList.size())
                .successfulFiles(successList)
                .failedFiles(failList)
                .build();
    }

    // Helper tìm hoặc tạo folder node (tối giản)
    private FileNode getOrCreateFolderNode(String name, FolderContext parentCtx, String userId) {
        Optional<FileNode> existing = fileNodeRepository.findByParentIdAndNameAndTypeAndIsDeletedFalse(parentCtx.getParentId(), name, EFileType.FOLDER);
        if (existing.isPresent()) return existing.get();

        FileNode newFolder = FileNode.builder()
                .name(name)
                .type(EFileType.FOLDER)
                .parentId(parentCtx.getParentId())
                .ancestors(parentCtx.getAncestors())
                .ownerId(userId)
                .status(EFileStatus.AVAILABLE)
                .isDeleted(false)
                .publicAccess(parentCtx.getPublicAccess())
                .permissions(parentCtx.getPermissions())
                .build();
        return fileNodeRepository.save(newFolder);
    }

    /**
     * DOWNLOAD (Giữ nguyên vì đã dùng Repository Query để check quyền)
     */
    @Transactional(readOnly = true)
    public FileDownloadResponse downloadFile(String fileId, String userId) throws Exception {
        // Hàm findByIdAndUserAccess trong Repository đã được cập nhật để check Public Access
        // nên đoạn này vẫn an toàn.
        FileNode fileNode = fileNodeRepository.findByIdAndUserAccess(fileId, userId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_ACCESS_DENIED));

        if (fileNode.getType() == EFileType.FOLDER) {
            throw new RuntimeException("Cannot download a folder directly.");
        }

        FileNode.EncryptionMetadata encMeta = fileNode.getEncryptionMetadata();
        if (encMeta == null || !fileNode.isEncrypted()) {
            throw new RuntimeException("File is not encrypted.");
        }

        FileKey fileKeyEntity = fileKeyRepository.findById(encMeta.getKeyId())
                .orElseThrow(() -> new RuntimeException("Encryption Key not found."));

        SecretKey originalFileKey = cryptoUtils.decryptFileKey(fileKeyEntity.getEncryptedKey());
        byte[] iv = cryptoUtils.decodeBase64(encMeta.getIv());

        GridFSFile gridFSFile = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(fileNode.getGridFsId())));
        if (gridFSFile == null) throw new AppException(AppErrorCode.FILE_NOT_FOUND);

        GridFsResource gridFsResource = gridFsTemplate.getResource(gridFSFile);
        InputStream encryptedStream = gridFsResource.getInputStream();
        Cipher decryptCipher = cryptoUtils.getDecryptCipher(originalFileKey, iv);
        CipherInputStream decryptedStream = new CipherInputStream(encryptedStream, decryptCipher);

        // ghi log da xem gan day
        recentFileService.logAccess(userId, fileId);

        return FileDownloadResponse.builder()
                .fileName(fileNode.getName())
                .contentType(fileNode.getMimeType())
                .fileSize(fileNode.getSize())
                .stream(new InputStreamResource(decryptedStream))
                .build();
    }

    // ==========================================
    // --- THÊM MỚI CHO DASHBOARD ---
    // ==========================================

    /**
     * Lấy thống kê Dashboard (Số lượng file, Tổng dung lượng)
     */
    public DashboardStatsResponse getDashboardStats(String userId) {
        // Đếm số file
        long totalFiles = fileNodeRepository.countByOwnerIdAndTypeAndIsDeletedFalse(userId, EFileType.FILE);

        // Tính tổng dung lượng (xử lý null nếu chưa có file nào)
        Long totalSizeWrapper = fileNodeRepository.getTotalSizeByOwnerId(userId);
        long totalSize = (totalSizeWrapper != null) ? totalSizeWrapper : 0L;

        return DashboardStatsResponse.builder()
                .totalFiles(totalFiles)
                .totalSize(totalSize)
                .build();
    }

    /**
     * Lấy danh sách File/Folder ở thư mục gốc (Home)
     */
    public List<FileResponse> getRootFiles(String userId, String sortBy, String direction) {
        // Tạo đối tượng Sort
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);

        // Gọi Repository tìm các node có parentId = null của user đó
        List<FileNode> nodes = fileNodeRepository.findByOwnerIdAndParentIdIsNullAndIsDeletedFalse(userId, sort);

        // Map từ Entity sang DTO (FileResponse) dùng ModelMapper có sẵn
        return nodes.stream()
                .map(node -> modelMapper.map(node, FileResponse.class))
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách File trong một thư mục cụ thể (hoặc Root nếu parentId null)
     */
    public List<FileResponse> getFilesByFolder(String userId, String parentId, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        List<FileNode> nodes;

        if (parentId == null || parentId.isEmpty() || "root".equals(parentId)) {
            // Lấy ở Root
            nodes = fileNodeRepository.findByOwnerIdAndParentIdIsNullAndIsDeletedFalse(userId, sort);
        } else {
            // Lấy trong Folder (Cần check quyền truy cập folder đó trước)
            // Lưu ý: findByParentIdAndUserAccess là hàm Custom Repository ta đã viết ở bước trước
            nodes = fileNodeRepository.findByParentIdAndUserAccess(parentId, userId);

            // Do hàm findByParentIdAndUserAccess chưa hỗ trợ Sort trong query @Query,
            // ta có thể sort thủ công ở đây hoặc nâng cấp Repository.
            // Để đơn giản, ta sort trên List Java:
            // (Bạn nên nâng cấp Repository để tối ưu hơn nếu dữ liệu lớn)
        }

        return nodes.stream()
                .map(node -> modelMapper.map(node, FileResponse.class))
                .collect(Collectors.toList());
    }

    /**
     * Lấy chuỗi Breadcrumbs (Gốc -> Cha -> Con)
     */
    public List<FileResponse> getBreadcrumbs(String folderId) {
        // 1. Lấy thông tin folder hiện tại
        FileNode currentFolder = fileNodeRepository.findByIdAndIsDeletedFalse(folderId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        // 2. Lấy danh sách ID các cha (ancestors)
        List<String> ancestorIds = currentFolder.getAncestors();

        // 3. Truy vấn DB lấy thông tin các cha
        List<FileNode> ancestors = fileNodeRepository.findAllByIdIn(ancestorIds);

        // 4. Sắp xếp lại theo đúng thứ tự trong mảng ancestorIds của currentFolder
        // (Vì findAllByIdIn không đảm bảo thứ tự trả về)
        List<FileResponse> breadcrumbs = new ArrayList<>();

        for (String id : ancestorIds) {
            ancestors.stream()
                    .filter(node -> node.getId().equals(id))
                    .findFirst()
                    .ifPresent(node -> breadcrumbs.add(modelMapper.map(node, FileResponse.class)));
        }

        // 5. Thêm chính folder hiện tại vào cuối chuỗi
        breadcrumbs.add(modelMapper.map(currentFolder, FileResponse.class));

        return breadcrumbs;
    }

    public List<FileResponse> getAllUserFolders(String userId) {
        List<FileNode> folders = fileNodeRepository.findAllFoldersByOwnerId(userId);
        return folders.stream()
                .map(node -> modelMapper.map(node, FileResponse.class))
                .collect(Collectors.toList());
    }

    // --- SAVE AVATAR FILE ---
    /**
     * Hàm lưu file vào GridFS và trả về URL tải file
     * Được sử dụng trong updateProfile để lưu Avatar
     */
    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Không thể lưu tệp rỗng.");
        }

        try {
            // 1. Tạo metadata (lưu loại file, size...)
            DBObject metadata = new BasicDBObject();
            metadata.put("contentType", file.getContentType());
            metadata.put("size", file.getSize());

            // 2. Lưu vào GridFS
            InputStream inputStream = file.getInputStream();
            ObjectId objectId = gridFsTemplate.store(
                    inputStream,
                    file.getOriginalFilename(),
                    file.getContentType(),
                    metadata
            );

            // 3. Tạo đường dẫn URL để Frontend truy cập
            // Ví dụ: http://localhost:8080/api/files/view/{id}
            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/files/view/")
                    .path(objectId.toString())
                    .toUriString();

            return fileDownloadUri;

        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi lưu file vào GridFS: " + e.getMessage());
        }
    }

    /**
     * Hàm lấy Resource từ GridFS để Controller trả về cho Client xem
     */
    public GridFSFile getFile(String id) {
        try {
            return gridFsTemplate.findOne(new Query(Criteria.where("_id").is(id)));
        } catch (Exception e) {
            throw new RuntimeException("Không tìm thấy file với ID: " + id);
        }
    }

    /**
     * Hàm xóa file khỏi GridFS
     */
    public void deleteFile(String id) {
        if (id == null || id.isEmpty()) return;

        try {
            // Xóa file có _id trùng với id truyền vào
            gridFsTemplate.delete(new Query(Criteria.where("_id").is(id)));
        } catch (Exception e) {
            // Log lỗi nhưng không cần throw exception để chặn luồng chính
            System.err.println("Lỗi khi xóa file cũ: " + e.getMessage());
        }
    }

    // =========================================================================
    // LOGIC ĐỔI TÊN (RENAME)
    // =========================================================================

    /**
     * 1. ĐỔI TÊN THƯ MỤC
     */
    @Transactional
    public FileResponse renameFolder(String id, String newName, String userId) {
        // A. Tìm Folder
        FileNode folder = fileNodeRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        // B. Validate loại Node
        if (folder.getType() != EFileType.FOLDER) {
            throw new AppException(AppErrorCode.INVALID_REQUEST);
        }

        // C. Check Quyền
        if (!fileShareService.hasEditAccess(folder, userId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        // D. Nếu tên không đổi -> Return luôn
        if (folder.getName().equals(newName)) {
            return modelMapper.map(folder, FileResponse.class);
        }

        // E. Check trùng tên
        checkDuplicateName(folder.getParentId(), newName, id, EFileType.FOLDER);

        // F. Cập nhật & Save DB
        folder.setName(newName);
        // Folder không có extension, hoặc extension rỗng

        FileNode savedNode = fileNodeRepository.save(folder);

        // G. Cập nhật Elasticsearch (Logic tối ưu)
        updateElasticsearchAfterRename(savedNode);

        return modelMapper.map(savedNode, FileResponse.class);
    }

    /**
     * 2. ĐỔI TÊN TỆP TIN (FILE)
     */
    @Transactional
    public FileResponse renameFile(String id, String newNameRaw, String userId) {
        // A. Tìm File
        FileNode fileNode = fileNodeRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        // B. Validate loại Node
        if (fileNode.getType() != EFileType.FILE) {
            throw new AppException(AppErrorCode.INVALID_REQUEST);
        }

        // C. Check Quyền
        if (!fileShareService.hasEditAccess(fileNode, userId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        // --- [FIX] LOGIC XỬ LÝ ĐUÔI FILE (EXTENSION) ---

        // 1. Lấy extension hiện tại và đảm bảo nó có dấu chấm (VD: "txt" -> ".txt")
        String currentExt = fileNode.getExtension();
        if (currentExt == null) currentExt = "";
        if (!currentExt.isEmpty() && !currentExt.startsWith(".")) {
            currentExt = "." + currentExt;
        }

        String finalName = newNameRaw;
        int lastDotIndex = newNameRaw.lastIndexOf('.');

        // 2. Phân tích tên mới người dùng nhập
        if (lastDotIndex == -1) {
            // TRƯỜNG HỢP 1: Nhập "tailieu" (Không có dấu chấm)
            // => Tự động nối thêm extension cũ
            // Kết quả: "tailieu" + ".txt" = "tailieu.txt"
            finalName = newNameRaw + currentExt;
        } else {
            // TRƯỜNG HỢP 2: Nhập "tailieu.docx" (Có dấu chấm)
            // => Tôn trọng input của người dùng (Cho phép đổi đuôi file)
            // Kết quả: "tailieu.docx"

            // (Optional) Nếu bạn muốn CHẶN người dùng đổi đuôi, uncomment đoạn dưới:
            /*
            String newExt = newNameRaw.substring(lastDotIndex);
            if (!newExt.equalsIgnoreCase(currentExt)) {
                 // Nếu đuôi mới khác đuôi cũ -> Báo lỗi hoặc ép về đuôi cũ
                 // finalName = newNameRaw.substring(0, lastDotIndex) + currentExt;
            }
            */
            finalName = newNameRaw;
        }

        // --------------------------------------------------

        // E. Nếu tên không đổi -> Return
        if (fileNode.getName().equals(finalName)) {
            return modelMapper.map(fileNode, FileResponse.class);
        }

        // F. Check trùng tên
        checkDuplicateName(fileNode.getParentId(), finalName, id, EFileType.FILE);

        // G. Cập nhật & Save DB
        fileNode.setName(finalName);

        // Cập nhật lại extension mới vào DB (quan trọng nếu user đổi từ .txt sang .docx)
        // Hàm getExt trả về extension không có dấu chấm (VD: "docx")
        fileNode.setExtension(getExt(finalName));

        FileNode savedNode = fileNodeRepository.save(fileNode);

        // H. Cập nhật Elasticsearch
        updateElasticsearchAfterRename(savedNode);

        return modelMapper.map(savedNode, FileResponse.class);
    }

    // =========================================================================
    // LOGIC CẬP NHẬT MÔ TẢ
    // =========================================================================

    /**
     * CẬP NHẬT MÔ TẢ (Dùng chung cho cả File và Folder)
     */
    @Transactional
    public FileResponse updateDescription(String id, String description, String userId) {
        // A. Tìm File/Folder
        FileNode node = fileNodeRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        // B. Check Quyền (Cần quyền Edit để sửa mô tả)
        if (!fileShareService.hasEditAccess(node, userId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        // C. Chuẩn hóa mô tả (Tránh null)
        String newDesc = description == null ? "" : description.trim();

        // D. Nếu không thay đổi -> Return luôn
        String oldDesc = node.getDescription() == null ? "" : node.getDescription();
        if (oldDesc.equals(newDesc)) {
            return modelMapper.map(node, FileResponse.class);
        }

        // E. Cập nhật & Save DB
        node.setDescription(newDesc);
        FileNode savedNode = fileNodeRepository.save(node);

        // F. Cập nhật Elasticsearch
        updateElasticsearchDescription(savedNode);

        return modelMapper.map(savedNode, FileResponse.class);
    }

    /**
     * LẤY CHI TIẾT FILE (Đầy đủ thông tin user, đường dẫn...)
     */
    public FileDetailResponse getFileDetails(String id, String userId) {
        // 1. Tìm Node
        FileNode node = fileNodeRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        // 2. Check Quyền (Cần ít nhất là quyền VIEW để xem thông tin)
        if (!fileShareService.hasReadAccess(node, userId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        // 3. TẬP HỢP TẤT CẢ USER ID CẦN LẤY THÔNG TIN
        // Bao gồm: Owner, UpdatedBy, và danh sách User trong Permissions
        Set<String> userIdsToFetch = new HashSet<>();
        userIdsToFetch.add(node.getOwnerId());

        if (node.getLastModifiedBy() != null) {
            userIdsToFetch.add(node.getLastModifiedBy());
        }

        if (node.getPermissions() != null) {
            node.getPermissions().forEach(p -> userIdsToFetch.add(p.getUserId()));
        }

        // 4. LẤY MAP USER TỪ DB (1 Query duy nhất)
        // Giả sử bạn có UserService hoặc UserRepository. Nếu là Microservices thì gọi UserClient.
        Map<String, FileDetailResponse.UserSummary> userMap = getUsersSummaryMap(userIdsToFetch);

        // 5. XÂY DỰNG CHUỖI ĐƯỜNG DẪN (LOCATION PATH)
        String path = buildLocationPath(node.getAncestors());

        // 6. BUILD PERMISSIONS LIST
        List<FileDetailResponse.PermissionDetail> sharedList = new ArrayList<>();
        if (node.getPermissions() != null) {
            sharedList = node.getPermissions().stream().map(p -> {
                return FileDetailResponse.PermissionDetail.builder()
                        .user(userMap.get(p.getUserId())) // Map từ ID sang Object User
                        .permissionType(p.getRole().name())
                        .build();
            }).collect(Collectors.toList());
        }

        // 7. RETURN RESPONSE
        return FileDetailResponse.builder()
                .id(node.getId())
                .name(node.getName())
                .description(node.getDescription())
                .type(node.getType())
                .size(node.getSize())
                .mimeType(node.getMimeType())
                .extension(node.getExtension())
                .locationPath(path) // <--- Đường dẫn text
                .createdAt(node.getCreatedAt())
                .updatedAt(node.getUpdatedAt())
                .owner(userMap.get(node.getOwnerId()))
                .lastModifiedBy(userMap.get(node.getLastModifiedBy())) // Người sửa cuối
                .publicAccess(node.getPublicAccess())
                .sharedWith(sharedList) // <--- Danh sách người được share
                .build();
    }

    // --- HELPER: XÂY DỰNG PATH TỪ ANCESTORS ---
    private String buildLocationPath(List<String> ancestorIds) {
        if (ancestorIds == null || ancestorIds.isEmpty()) {
            return "Thư mục gốc";
        }

        // Lấy tên của tất cả folder cha (Dùng findAllById)
        List<FileNode> ancestors = fileNodeRepository.findAllById(ancestorIds);

        // MongoDB findAllById không đảm bảo thứ tự trả về giống thứ tự List đầu vào
        // Nên ta cần map lại ID -> Name để sắp xếp đúng
        Map<String, String> idNameMap = ancestors.stream()
                .collect(Collectors.toMap(FileNode::getId, FileNode::getName));

        StringBuilder pathBuilder = new StringBuilder("Thư mục gốc");

        for (String ancId : ancestorIds) {
            if (idNameMap.containsKey(ancId)) {
                pathBuilder.append(" / ").append(idNameMap.get(ancId));
            }
        }

        return pathBuilder.toString();
    }

    /**
     * Helper: Tự xử lý việc map User Entity -> UserSummary DTO
     * (Không cần gọi qua UserService nữa)
     */
    private Map<String, FileDetailResponse.UserSummary> getUsersSummaryMap(Set<String> userIds) {
        List<User> users = userRepository.findAllById(userIds);

        return users.stream().collect(Collectors.toMap(
                User::getId,
                user -> FileDetailResponse.UserSummary.builder()
                        .id(user.getId())
                        .name(user.getFullName())
                        .email(user.getEmail())
                        .avatarUrl(user.getAvatarUrl())
                        .build()
        ));
    }

    // --- HELPER FUNCTIONS ---

    private void saveToElasticsearch(FileNode node) {
        saveToElasticsearch(node, null);
    }

    private void saveToElasticsearch(FileNode node, String content) {
        List<String> allowed = new ArrayList<>();
        allowed.add(node.getOwnerId());

        if (node.getPermissions() != null) {
            node.getPermissions().forEach(p -> allowed.add(p.getUserId()));
        }

        DocumentIndex docIndex = DocumentIndex.builder()
                .id(node.getId())
                .name(node.getName()) // Map getName() vào name
                .description(node.getDescription())
                .content(content)
                .type(node.getType().name())
                .extension(node.getExtension())
                .mimeType(node.getMimeType()) // Lưu mimeType
                .size(node.getSize())         // Lưu size
                .status(node.getStatus().name())
                .isDeleted(node.isDeleted())
                .ownerId(node.getOwnerId())
                .allowedUsers(allowed)
                .ancestors(node.getAncestors())
                // Convert LocalDateTime sang String ISO-8601
                .createdAt(node.getCreatedAt() != null ? node.getCreatedAt().toString() : null)
                .updatedAt(node.getUpdatedAt() != null ? node.getUpdatedAt().toString() : null)
                .build();

        documentIndexRepository.save(docIndex);
    }

    /**
     * Helper: Chỉ cập nhật các trường thay đổi lên ES
     * Để tránh làm mất 'content' (nội dung file) đã được index trước đó.
     */
    private void updateElasticsearchAfterRename(FileNode node) {
        try {
            // 1. Tìm document cũ trong ES
            DocumentIndex existingDoc = documentIndexRepository.findById(node.getId()).orElse(null);

            if (existingDoc != null) {
                // 2. Chỉ cập nhật Metadata (Giữ nguyên field 'content')
                existingDoc.setName(node.getName());
                existingDoc.setExtension(node.getExtension());
                existingDoc.setUpdatedAt(node.getUpdatedAt() != null ? node.getUpdatedAt().toString() : null);

                // Lưu đè lại (Spring Data ES sẽ update document này)
                documentIndexRepository.save(existingDoc);
            } else {
                // 3. Trường hợp hiếm: File có trong DB nhưng chưa có trong ES
                // Lúc này đành phải tạo mới (Content sẽ null, chấp nhận được vì còn hơn không có)
                saveToElasticsearch(node);
            }
        } catch (Exception e) {
            // Log lỗi nhưng không chặn luồng chính
            System.err.println("Lỗi đồng bộ Elasticsearch khi Rename: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Helper: Chỉ cập nhật trường description lên ES
     */
    private void updateElasticsearchDescription(FileNode node) {
        try {
            DocumentIndex existingDoc = documentIndexRepository.findById(node.getId()).orElse(null);

            if (existingDoc != null) {
                // Chỉ update trường description và thời gian update
                existingDoc.setDescription(node.getDescription());
                existingDoc.setUpdatedAt(node.getUpdatedAt() != null ? node.getUpdatedAt().toString() : null);

                documentIndexRepository.save(existingDoc);
            } else {
                // Nếu chưa có doc thì tạo mới (chấp nhận mất content nếu là file)
                saveToElasticsearch(node);
            }
        } catch (Exception e) {
            System.err.println("Lỗi đồng bộ ES (Description): " + e.getMessage());
        }
    }

    /**
     * Helper: Kiểm tra trùng tên
     */
    private void checkDuplicateName(String parentId, String name, String excludeId, EFileType type) {
        boolean exists = fileNodeRepository.existsByParentIdAndNameAndIsDeletedFalseAndIdNot(
                parentId, name, excludeId
        );

        if (exists) {
            if (type == EFileType.FOLDER) {
                throw new AppException(AppErrorCode.FOLDER_NAME_EXISTED);
            } else {
                throw new AppException(AppErrorCode.FILE_NAME_EXISTED);
            }
        }
    }

    private String getExt(String fileName) {
        return fileName != null && fileName.contains(".")
                ? fileName.substring(fileName.lastIndexOf(".") + 1) : "";
    }

    @Data
    @Builder
    public static class FolderContext {
        private String parentId;
        private List<String> ancestors;
        private EPublicAccess publicAccess;
        private List<FileNode.FilePermission> permissions;
    }
}