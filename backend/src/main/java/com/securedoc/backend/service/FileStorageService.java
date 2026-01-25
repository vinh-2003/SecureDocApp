package com.securedoc.backend.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.SecretKey;

import org.apache.tika.Tika;
import org.bson.types.ObjectId;
import org.modelmapper.ModelMapper;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.GroupOperation;
import org.springframework.data.mongodb.core.aggregation.MatchOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.securedoc.backend.dto.file.BatchUploadResponse;
import com.securedoc.backend.dto.file.DashboardStatsResponse;
import com.securedoc.backend.dto.file.FileDetailResponse;
import com.securedoc.backend.dto.file.FileDownloadResponse;
import com.securedoc.backend.dto.file.FileIdListRequest;
import com.securedoc.backend.dto.file.FileMetadataRequest;
import com.securedoc.backend.dto.file.FileMoveRequest;
import com.securedoc.backend.dto.file.FileResponse;
import com.securedoc.backend.dto.file.FolderCreateRequest;
import com.securedoc.backend.dto.internal.StoredFileResult;
import com.securedoc.backend.dto.response.BreadcrumbDto;
import com.securedoc.backend.dto.response.RecentFileResponse;
import com.securedoc.backend.dto.response.UserPermissions;
import com.securedoc.backend.entity.FileKey;
import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.entity.FilePage;
import com.securedoc.backend.entity.RecentFile;
import com.securedoc.backend.entity.User;
import com.securedoc.backend.entity.UserPageAccess;
import com.securedoc.backend.enums.EFileStatus;
import com.securedoc.backend.enums.EFileType;
import com.securedoc.backend.enums.EPermissionRole;
import com.securedoc.backend.enums.EPublicAccess;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.repository.FileKeyRepository;
import com.securedoc.backend.repository.FileNodeRepository;
import com.securedoc.backend.repository.FilePageRepository;
import com.securedoc.backend.repository.PageAccessRequestRepository;
import com.securedoc.backend.repository.RecentFileRepository;
import com.securedoc.backend.repository.UserPageAccessRepository;
import com.securedoc.backend.repository.UserRepository;
import com.securedoc.backend.repository.elasticsearch.DocumentIndexRepository;
import com.securedoc.backend.repository.elasticsearch.PageIndexRepository;
import com.securedoc.backend.service.elasticsearch.DocumentIndexService;
import com.securedoc.backend.utils.CryptoUtils;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final FileNodeRepository fileNodeRepository;
    private final DocumentIndexService documentIndexService;
    private final DocumentIndexRepository documentIndexRepository;
    private final FileKeyRepository fileKeyRepository;
    private final RecentFileService recentFileService;
    private final UserRepository userRepository;
    private final CoreFileService coreFileService;
    private final FileProcessorService fileProcessorService;
    private final FilePageRepository filePageRepository;
    private final UserPageAccessRepository userPageAccessRepository;
    private final RecentFileRepository recentFileRepository;
    private final PageAccessRequestRepository pageAccessRequestRepository;
    private final PageIndexRepository pageIndexRepository;
    private final ActivityLogService activityLogService;
    private final PermissionService permissionService;
    private final MongoTemplate mongoTemplate;

    private final ModelMapper modelMapper;
    private final GridFsTemplate gridFsTemplate;
    private final CryptoUtils cryptoUtils;
    private final Tika tika;

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf", // .pdf
            "application/msword", // .doc
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
    );

    /**
     * 1. HÀM DÙNG CHUNG: KIỂM TRA QUYỀN & LẤY THÔNG TIN THỪA KẾ - Check tồn tại
     * folder cha - Check quyền User - Lấy Ancestors, Permissions
     */
    private FolderContext getParentContext(String parentId, String userId) {
        if (parentId == null || parentId.isEmpty()) {
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
        if (!permissionService.hasEditAccess(parent, userId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        // Logic thừa kế Ancestors
        List<String> ancestors = new ArrayList<>(parent.getAncestors());
        ancestors.add(parent.getId());

        // --- [LOGIC MỚI] XỬ LÝ QUYỀN THỪA KẾ ---
        // 1. Lấy danh sách quyền gốc từ cha
        List<FileNode.FilePermission> inheritedPerms = parent.getPermissions() != null
                ? new ArrayList<>(parent.getPermissions()) // Copy ra list mới để sửa
                : new ArrayList<>();

        // 2. [QUAN TRỌNG] Lọc bỏ tất cả "Thái thượng hoàng" và owner
        //    Chỉ giữ lại permissions cho người dùng thực sự ngoài hệ thống phân cấp
        List<FileNode.FilePermission> filteredPerms = filterOutHierarchyUsers(
                inheritedPerms, parent, userId
        );

        return FolderContext.builder()
                .parentId(parent.getId())
                .ancestors(ancestors)
                .publicAccess(parent.getPublicAccess())
                .permissions(filteredPerms)
                .build();
    }

    /**
     * Lọc bỏ tất cả users là "Thái thượng hoàng" (owner/editor của tổ tiên) và
     * owner hiện tại Chỉ giữ lại permissions cho người dùng thực sự ngoài hệ
     * thống phân cấp
     */
    private List<FileNode.FilePermission> filterOutHierarchyUsers(
            List<FileNode.FilePermission> permissions,
            FileNode parentNode,
            String currentUserId
    ) {
        if (permissions.isEmpty()) {
            return new ArrayList<>();
        }

        // 1. Tập hợp tất cả user là "Thái thượng hoàng"
        Set<String> hierarchyUsers = getHierarchyUsers(parentNode);

        // 2. Thêm owner hiện tại (người tạo folder mới) vào danh sách loại bỏ
        hierarchyUsers.add(currentUserId);

        // 3. Thêm owner của parent vào danh sách loại bỏ (vì họ là "Thái thượng hoàng" của con)
        hierarchyUsers.add(parentNode.getOwnerId());

        // 4. Lọc bỏ tất cả permissions cho hierarchy users
        return permissions.stream()
                .filter(perm -> !hierarchyUsers.contains(perm.getUserId()))
                .collect(Collectors.toList());
    }

    /**
     * Lấy tất cả user là "Thái thượng hoàng" (owner của tổ tiên)
     */
    private Set<String> getHierarchyUsers(FileNode node) {
        Set<String> hierarchyUsers = new HashSet<>();

        if (node.getAncestors() != null && !node.getAncestors().isEmpty()) {
            // Lấy tất cả ancestors từ DB
            List<FileNode> ancestors = fileNodeRepository.findAllById(node.getAncestors());

            // Thêm tất cả owner của ancestors
            ancestors.forEach(ancestor -> hierarchyUsers.add(ancestor.getOwnerId()));

            // [TUỲ CHỌN] Có thể thêm editor của ancestors nếu muốn
            // ancestors.forEach(ancestor -> {
            //     ancestor.getPermissions().stream()
            //         .filter(p -> p.getRole() == EPermissionRole.EDITOR)
            //         .forEach(p -> hierarchyUsers.add(p.getUserId()));
            // });
        }

        return hierarchyUsers;
    }

    /**
     * 2. HÀM DÙNG CHUNG: XỬ LÝ TÊN FILE (TỰ ĐỔI TÊN NẾU TRÙNG)
     */
    private String generateUniqueFileName(String parentId, String originalName, String userId) {
        String finalName = originalName;
        String baseName = originalName;
        String extension = "";

        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex >= 0) {
            baseName = originalName.substring(0, dotIndex);
            extension = originalName.substring(dotIndex);
        }

        int count = 1;
        while (fileNodeRepository.existsByParentIdAndNameAndOwnerIdAndIsDeletedFalse(parentId, finalName, userId)) {
            finalName = baseName + " (" + count + ")" + extension;
            count++;
        }
        return finalName;
    }

    /**
     * [CORE METHOD] HÀM LƯU TRỮ DÙNG CHUNG Chịu trách nhiệm: Tạo Key -> Lưu
     * GridFS -> Lưu Metadata -> Index Elastic -> Trigger Async
     */
    private FileResponse internalStoreFile(
            InputStream inputStream, // Stream dữ liệu (Từ Upload hoặc từ File gốc đã giải mã)
            String fileName,
            String mimeType,
            long size,
            FolderContext context, // Context quyền hạn
            String userId, // Chủ sở hữu mới
            String description,
            String extractedText // Text đã trích xuất (nếu có)
    ) throws Exception {

        // 1. Tạo Key mã hóa mới (Mỗi file/bản sao có key riêng biệt -> Bảo mật cao)
        SecretKey fileKey = cryptoUtils.generateSecretKey();

        // 2. Gọi Core Service: Mã hoá & Lưu vào GridFS
        // (Hàm này trả về ID GridFS và IV)
        StoredFileResult storedResult = coreFileService.storeWithExistingKey(inputStream, fileName, mimeType, fileKey);

        // 3. Tạo Metadata (FileNode)
        FileNode fileNode = FileNode.builder()
                .name(fileName)
                .description(description)
                .type(EFileType.FILE)
                .parentId(context.getParentId())
                .ancestors(context.getAncestors())
                .size(size)
                .mimeType(mimeType)
                .extension(getExt(fileName))
                .gridFsId(storedResult.getGridFsId())
                .ownerId(userId)
                .status(EFileStatus.PROCESSING) // Hoặc PROCESSING
                .isEncrypted(true)
                .isDeleted(false)
                .publicAccess(context.getPublicAccess())
                .permissions(context.getPermissions())
                .encryptionMetadata(new FileNode.EncryptionMetadata(
                        "AES/GCM/NoPadding",
                        cryptoUtils.encodeBase64(storedResult.getIv()),
                        null))
                .build();

        FileNode savedNode = fileNodeRepository.save(fileNode);

        // 4. Lưu Key (FileKey)
        FileKey keyEntity = FileKey.builder()
                .fileNodeId(savedNode.getId())
                .algorithm("AES")
                .encryptedKey(cryptoUtils.encryptFileKey(storedResult.getSecretKey())) // Mã hóa key file bằng Master Key
                .masterKeyVersion(1)
                .build();
        FileKey savedKey = fileKeyRepository.save(keyEntity);

        // Update ngược KeyId vào Node
        savedNode.getEncryptionMetadata().setKeyId(savedKey.getId());
        fileNodeRepository.save(savedNode);

        // 5. Lưu ElasticSearch
        documentIndexService.saveToElasticsearch(savedNode, extractedText);

        // 6. Trigger Async Task (Tách trang / Xử lý hậu kỳ)
        // TỐI ƯU QUAN TRỌNG: Không truyền byte[] để tránh tràn RAM.
        // Service Async sẽ tự tải file từ GridFS về để xử lý.
        if (isSupportPreview(mimeType)) {
            // Chỉ truyền Node và Key giải mã (bản chưa encrypt)
            fileProcessorService.processFilePages(savedNode, fileKey);
        }

        activityLogService.logFileUploaded(savedNode, userId);

        return convertToResponse(savedNode, userId);
    }

    /**
     * WRAPPER 1: Xử lý Upload mới (Từ MultipartFile)
     */
    private FileResponse processFileSave(MultipartFile file, String fileName, FolderContext context, String userId, String description) throws Exception {
        // A. Validate & Detect Type
        String realMimeType;
        try (InputStream stream = file.getInputStream()) {
            realMimeType = tika.detect(stream);
        }

        if (!ALLOWED_MIME_TYPES.contains(realMimeType)) {
            throw new AppException(AppErrorCode.INVALID_FILE_FORMAT);
        }

        // B. Trích xuất Text (Optional - Fail safe)
        String extractedContent = "";
        try (InputStream stream = file.getInputStream()) {
            extractedContent = tika.parseToString(stream);
        } catch (Exception e) {
            /* Ignore */ }

        // C. Gọi hàm chung
        // Mở stream mới để truyền vào hàm lưu (Vì stream cũ đã bị Tika đọc hết)
        try (InputStream saveStream = file.getInputStream()) {
            return internalStoreFile(
                    saveStream,
                    fileName,
                    realMimeType,
                    file.getSize(),
                    context,
                    userId,
                    description,
                    extractedContent
            );
        }
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
        if (fileNodeRepository.existsByParentIdAndNameAndOwnerIdAndIsDeletedFalse(context.getParentId(), request.getName(), userId)) {
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
        documentIndexService.saveToElasticsearch(savedFolder);

        activityLogService.logFolderCreated(savedFolder, userId);

        return convertToResponse(savedFolder, userId);
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
                String uniqueName = generateUniqueFileName(parentContext.getParentId(), originalName, userId);

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
        if (files.length != paths.length) {
            throw new AppException(AppErrorCode.INVALID_UPLOAD_BATCH_REQUEST);
        }

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
                String uniqueName = generateUniqueFileName(currentContext.getParentId(), originalName, userId);
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
        Optional<FileNode> existing = fileNodeRepository.findByParentIdAndNameAndTypeAndOwnerIdAndIsDeletedFalse(parentCtx.getParentId(), name, EFileType.FOLDER, userId);
        if (existing.isPresent()) {
            return existing.get();
        }

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
        FileNode savedFolder = fileNodeRepository.save(newFolder);
        documentIndexService.saveToElasticsearch(savedFolder);

        activityLogService.logFolderCreated(savedFolder, userId);

        return savedFolder;
    }

    /**
     * RETRY: Thử xử lý lại file bị lỗi (CÓ DỌN DẸP)
     */
    @Transactional
    public void retryProcessing(String fileId, String userId) throws Exception {
        // 1. Tìm file
        FileNode node = fileNodeRepository.findByIdAndIsDeletedFalse(fileId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        // 2. Check quyền
        if (!permissionService.hasEditAccess(node, userId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        // 3. Chỉ retry nếu chưa AVAILABLE
        if (node.getStatus() == EFileStatus.AVAILABLE) {
            throw new AppException(AppErrorCode.FILE_ALREADY_PROCESSED);
        }

        // --- [MỚI] BƯỚC QUAN TRỌNG: DỌN DẸP DỮ LIỆU CŨ/LỖI ---
        // Xóa sạch các FilePage (ảnh rõ/mờ) đã tạo ra trong lần chạy trước
        cleanupFilePages(fileId);

        // (Tùy chọn) Có thể xóa cả các yêu cầu truy cập cũ nếu muốn reset hoàn toàn
        pageAccessRequestRepository.deleteByFileId(fileId);

        // 4. Lấy lại Key giải mã
        FileNode.EncryptionMetadata encMeta = node.getEncryptionMetadata();
        if (encMeta == null || encMeta.getKeyId() == null) {
            throw new AppException(AppErrorCode.FILE_NOT_ENCRYPTED_OR_MISSING_KEY);
        }

        FileKey fileKeyEntity = fileKeyRepository.findById(encMeta.getKeyId())
                .orElseThrow(() -> new AppException(AppErrorCode.KEY_NOT_FOUND));

        SecretKey originalKey = cryptoUtils.decryptFileKey(fileKeyEntity.getEncryptedKey());

        // 5. Cập nhật trạng thái về PROCESSING
        node.setStatus(EFileStatus.PROCESSING);
        FileNode savedNode = fileNodeRepository.save(node);

        documentIndexService.updateElasticsearchStatus(savedNode);

        // 6. Gọi lại Async Task
        fileProcessorService.processFilePages(node, originalKey);
    }

    /**
     * DOWNLOAD FILE
     */
    @Transactional(readOnly = true)
    public FileDownloadResponse downloadFile(String fileId, String userId) throws Exception {
        // 1. CHECK QUYỀN TRUY CẬP NODE (Quyền xem metadata cơ bản)
        FileNode fileNode = getFileAndValidateAccess(fileId, userId);

        if (fileNode.getType() == EFileType.FOLDER) {
            throw new AppException(AppErrorCode.DOWNLOAD_FOLDER);
        }

        // 2. CHECK QUYỀN TẢI XUỐNG (Logic chặt chẽ mới)
        validateDownloadOrCopyPermission(fileNode, userId);

        // 3. CHECK ENCRYPTION & DECRYPT (Giữ nguyên)
        FileNode.EncryptionMetadata encMeta = fileNode.getEncryptionMetadata();
        if (encMeta == null || !fileNode.isEncrypted()) {
            throw new AppException(AppErrorCode.FILE_NOT_ENCRYPTED);
        }

        FileKey fileKeyEntity = fileKeyRepository.findById(encMeta.getKeyId())
                .orElseThrow(() -> new AppException(AppErrorCode.KEY_NOT_FOUND));

        SecretKey originalFileKey = cryptoUtils.decryptFileKey(fileKeyEntity.getEncryptedKey());
        byte[] iv = cryptoUtils.decodeBase64(encMeta.getIv());

        // Lấy file từ GridFS
        GridFSFile gridFSFile = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(fileNode.getGridFsId())));
        if (gridFSFile == null) {
            throw new AppException(AppErrorCode.FILE_NOT_FOUND);
        }

        GridFsResource gridFsResource = gridFsTemplate.getResource(gridFSFile);
        InputStream encryptedStream = gridFsResource.getInputStream();
        Cipher decryptCipher = cryptoUtils.getDecryptCipher(originalFileKey, iv);
        CipherInputStream decryptedStream = new CipherInputStream(encryptedStream, decryptCipher);

        // 4. LOGGING
        recentFileService.logAccess(userId, fileId);

        activityLogService.logDownloaded(fileNode, userId);

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
     * Lấy thống kê Dashboard (Dựa trên KHÔNG GIAN LƯU TRỮ) Tính toàn bộ file
     * tại Root của User + File trong các thư mục con/cháu (kể cả do người khác
     * tạo)
     */
    public DashboardStatsResponse getDashboardStats(String userId) {

        // BƯỚC 1: Lấy danh sách ID của các thư mục gốc (Root Folders) thuộc về User này
        List<String> rootFolderIds = fileNodeRepository.findRootFolderIdsByOwnerId(userId)
                .stream()
                .map(FileNode::getId)
                .collect(Collectors.toList());

        // BƯỚC 2: Xây dựng Query tính toán
        // Điều kiện: File phải chưa bị xóa và là FILE (không tính folder)
        Criteria criteria = Criteria.where("type").is(EFileType.FILE)
                .and("isDeleted").is(false);

        // Logic "Nằm trong không gian của User":
        // TRƯỜNG HỢP A: File nằm ngay tại Root (parentId = null) và do User sở hữu
        Criteria isRootFile = Criteria.where("ownerId").is(userId).and("parentId").is(null);

        // TRƯỜNG HỢP B: File nằm sâu bên trong (có tổ tiên là một trong các Root Folder của User)
        // Bất kể ai upload, miễn là nó nằm trong cây thư mục của User này
        Criteria isInsideUserTree = Criteria.where("ancestors").in(rootFolderIds);

        // Kết hợp A hoặc B
        if (!rootFolderIds.isEmpty()) {
            criteria.orOperator(isRootFile, isInsideUserTree);
        } else {
            // Nếu user không có thư mục nào, chỉ tính file lẻ ở root
            criteria.andOperator(isRootFile);
        }

        // BƯỚC 3: Thực hiện Aggregation để đếm và tính tổng size
        MatchOperation matchStage = Aggregation.match(criteria);

        GroupOperation groupStage = Aggregation.group() // Group tất cả lại thành 1 cục
                .count().as("totalFiles")
                .sum("size").as("totalSize");

        Aggregation aggregation = Aggregation.newAggregation(matchStage, groupStage);

        // Chạy query
        AggregationResults<Map> results = mongoTemplate.aggregate(aggregation, "file_nodes", Map.class);
        Map<String, Object> result = results.getUniqueMappedResult();

        // BƯỚC 4: Parse kết quả
        long totalFiles = 0;
        long totalSize = 0;

        if (result != null) {
            totalFiles = ((Number) result.getOrDefault("totalFiles", 0)).longValue();
            totalSize = ((Number) result.getOrDefault("totalSize", 0)).longValue();
        }

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
                .map(node -> convertToResponse(node, userId))
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách File trong thư mục (Áp dụng Feudal System)
     */
    public List<FileResponse> getFilesByFolder(String userId, String parentId, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        List<FileNode> nodes;

        // TRƯỜNG HỢP 1: LẤY TẠI ROOT (Của tôi)
        if (parentId == null || parentId.isEmpty() || "root".equals(parentId)) {
            // Root của tôi thì đương nhiên tôi thấy hết
            nodes = fileNodeRepository.findByOwnerIdAndParentIdIsNullAndIsDeletedFalse(userId, sort);
        } // TRƯỜNG HỢP 2: LẤY TRONG FOLDER CON
        else {
            // A. Lấy thông tin Folder cha để kiểm tra "giấy thông hành"
            FileNode parentFolder = fileNodeRepository.findByIdAndIsDeletedFalse(parentId)
                    .orElseThrow(() -> new AppException(AppErrorCode.FOLDER_NOT_FOUND));

            // B. Check quyền vào cửa (Gatekeeper)
            if (!permissionService.hasReadAccess(parentFolder, userId)) {
                throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
            }

            // C. Phân loại thân phận: Lãnh chúa hay Khách?
            if (permissionService.isLandlord(parentFolder, userId)) {
                // === LÃNH CHÚA (Landlord) ===
                // Thấy tất cả mọi thứ bên trong, bất kể quyền con là gì
                // (Vì "Đất vua không ai có quyền rào lại")
                nodes = fileNodeRepository.findAllByParentIdAndIsDeletedFalse(parentId, sort);
            } else {
                // === KHÁCH (Guest/Collaborator) ===
                // Chỉ thấy những gì được phép thấy (Public hoặc Shared với mình)
                // Ví dụ: Trong Folder F1 (Shared), có file F2 (Private của người khác) -> Khách không thấy F2.
                nodes = fileNodeRepository.findByParentIdAndUserAccess(parentId, userId, sort);
            }
        }

        return nodes.stream()
                .map(node -> convertToResponse(node, userId))
                .collect(Collectors.toList());
    }

    public List<FileResponse> getAllUserFolders(String userId) {
        List<FileNode> folders = fileNodeRepository.findAllFoldersByOwnerId(userId);
        return folders.stream()
                .map(node -> modelMapper.map(node, FileResponse.class))
                .collect(Collectors.toList());
    }

    /**
     * Tạo Breadcrumb thông minh
     */
    public List<BreadcrumbDto> getContextAwareBreadcrumbs(String folderId, String userId) {
        LinkedList<BreadcrumbDto> breadcrumbs = new LinkedList<>();
        String currentId = folderId;

        while (currentId != null) {
            // 1. Lấy thông tin Node hiện tại
            FileNode node = fileNodeRepository.findByIdAndIsDeletedFalse(currentId).orElse(null);

            if (node == null) {
                break;
            }

            // 2. [FIX QUAN TRỌNG] Check quyền truy cập NGAY LẬP TỨC
            // Nếu không có quyền xem node này -> Dừng ngay, không thêm vào danh sách
            // (Xử lý trường hợp leo từ con lên cha, nhưng cha bị Private/Mất quyền)
            if (!permissionService.hasReadAccess(node, userId)) {
                break;
            }

            // 3. Tính toán quyền hạn (Để hiển thị menu ngữ cảnh trên breadcrumb)
            UserPermissions perms = calculateUserPermissions(node, userId);

            // 4. Thêm vào đầu danh sách
            breadcrumbs.addFirst(new BreadcrumbDto(
                    node.getId(),
                    node.getName(),
                    node.getOwnerId(),
                    perms
            ));

            // 5. Logic dừng leo (Visual Root Boundary)
            // Ngăn việc leo quá cao ra khỏi phạm vi được chia sẻ.
            // Ví dụ: F1 (Private) -> F2 (Shared) -> F3 (Shared).
            // Nếu đang ở F3, leo lên F2 (OK). Leo lên F1 (Dừng).
            // Nếu node hiện tại đã là Root (không có cha) -> Dừng
            if (node.getParentId() == null) {
                break;
            }

            // [LOGIC CŨ ĐÃ TỐI ƯU]
            // Nếu đây là file của người khác, cần check xem có được phép leo tiếp lên cha không
            if (!node.getOwnerId().equals(userId)) {
                // Kiểm tra nhanh: Nếu KHÔNG CÓ quyền xem CHA -> Dừng tại đây (Node này là Root ảo)
                // Ta dùng ID cha để check quyền trước khi gán currentId
                FileNode parentNode = fileNodeRepository.findByIdAndIsDeletedFalse(node.getParentId()).orElse(null);

                if (parentNode == null || !permissionService.hasReadAccess(parentNode, userId)) {
                    // Không thấy cha hoặc không có quyền xem cha -> Dừng
                    break;
                }
            }

            // 6. Leo tiếp lên cha
            currentId = node.getParentId();
        }

        return breadcrumbs;
    }

    /**
     * Lấy danh sách gần đây có phân trang + thời gian truy cập
     */
    public List<RecentFileResponse> getRecentFiles(String userId, int page, int limit) {
        // 1. Lấy trang RecentFile từ DB
        Pageable pageable = PageRequest.of(page, limit);
        List<RecentFile> recentLogs = recentFileRepository.findAllByUserIdOrderByAccessedAtDesc(userId, pageable);

        if (recentLogs.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Lấy danh sách ID file
        List<String> fileIds = recentLogs.stream()
                .map(RecentFile::getFileId)
                .collect(Collectors.toList());

        // 3. Lấy thông tin FileNode
        List<FileNode> fileNodes = fileNodeRepository.findAllById(fileIds);
        Map<String, FileNode> fileMap = fileNodes.stream()
                .collect(Collectors.toMap(FileNode::getId, Function.identity()));

        // 4. Ghép dữ liệu & Lọc quyền
        return recentLogs.stream()
                .map(log -> {
                    FileNode node = fileMap.get(log.getFileId());

                    // A. Check tồn tại và trạng thái xoá
                    if (node == null || node.isDeleted()) {
                        return null;
                    }

                    // B. [MỚI] Check quyền truy cập hiện tại (Real-time Security Check)
                    // Dù trong log có ghi là đã xem, nhưng giờ mất quyền thì không được hiện nữa
                    if (!permissionService.hasReadAccess(node, userId)) {
                        return null;
                    }

                    // Convert Node -> FileResponse DTO
                    FileResponse fileDto = convertToResponse(node, userId);

                    return RecentFileResponse.builder()
                            .file(fileDto)
                            .accessedAt(log.getAccessedAt())
                            .build();
                })
                .filter(Objects::nonNull) // Loại bỏ null (file xoá hoặc mất quyền)
                .collect(Collectors.toList());
    }

    @Transactional
    public BatchUploadResponse moveFiles(FileMoveRequest request, String userId) {
        List<BatchUploadResponse.FileItemStatus> successList = new ArrayList<>();
        List<BatchUploadResponse.FileItemStatus> failList = new ArrayList<>();

        // 1. Lấy Context đích (Bao gồm Ancestors và Permissions của đích)
        FileStorageService.FolderContext targetContext;
        try {
            targetContext = getParentContext(request.getTargetParentId(), userId);
        } catch (Exception e) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        // 2. Duyệt qua từng file cần di chuyển
        for (String id : request.getItemIds()) {
            try {
                // A. Lấy Node và Validate quyền Edit
                FileNode nodeToMove = fileNodeRepository.findByIdAndIsDeletedFalse(id)
                        .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

                String fromParentId = nodeToMove.getParentId();  // <-- LƯU VỊ TRÍ CŨ
                String fromPath = buildLocationPath(nodeToMove.getAncestors());  // <-- LƯU PATH CŨ

                if (!permissionService.hasEditAccess(nodeToMove, userId)) {
                    throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
                }

                // B. Check Logic Vòng lặp & Vị trí cũ
                String currentParentId = nodeToMove.getParentId();
                String targetParentId = targetContext.getParentId();

                if (Objects.equals(currentParentId, targetParentId)) {
                    successList.add(new BatchUploadResponse.FileItemStatus(nodeToMove.getName(), "File đã ở đúng vị trí", null));
                    continue;
                }

                if (nodeToMove.getType() == EFileType.FOLDER && targetParentId != null) {
                    if (targetParentId.equals(nodeToMove.getId())
                            || targetContext.getAncestors().contains(nodeToMove.getId())) {
                        throw new AppException(AppErrorCode.CANNOT_MOVE_FOLDER_INTO_ITSELF);
                    }
                }

                // C. Xử lý trùng tên (Rename nếu cần)
                String originalName = nodeToMove.getName();
                String newName = generateUniqueFileName(targetParentId, originalName, userId);
                if (!originalName.equals(newName)) {
                    nodeToMove.setName(newName);
                }

                // D. Cập nhật Vị trí
                nodeToMove.setParentId(targetParentId);
                nodeToMove.setAncestors(targetContext.getAncestors());

                // E. [SỬA] XỬ LÝ PHÂN QUYỀN (INHERIT STRATEGY)
                // Lấy quyền của thư mục đích áp vào node đang di chuyển
                applyInheritedPermissions(
                        nodeToMove,
                        targetContext.getPublicAccess(),
                        targetContext.getPermissions()
                );

                // F. Lưu Node
                FileNode savedNode = fileNodeRepository.save(nodeToMove);

                // G. Cập nhật ElasticSearch
                documentIndexService.updateElasticsearchMetadata(savedNode);

                String toPath = buildLocationPath(savedNode.getAncestors());
                activityLogService.logMoved(savedNode, fromParentId, fromPath, toPath, userId);

                // H. NẾU LÀ FOLDER: Lan truyền xuống con cháu
                if (savedNode.getType() == EFileType.FOLDER) {
                    // Truyền node vừa lưu (đã mang quyền mới) vào để đệ quy
                    updateDescendantsRecursively(savedNode);
                }

                String msg = !originalName.equals(newName) ? "Di chuyển và đổi tên thành: " + newName : "Di chuyển thành công";
                successList.add(new BatchUploadResponse.FileItemStatus(originalName, msg, convertToResponse(savedNode, userId)));

            } catch (Exception e) {
                failList.add(new BatchUploadResponse.FileItemStatus(id, e.getMessage(), null));
            }
        }

        return BatchUploadResponse.builder()
                .totalFiles(request.getItemIds().size())
                .successCount(successList.size())
                .failCount(failList.size())
                .successfulFiles(successList)
                .failedFiles(failList)
                .build();
    }

    /**
     * [MỚI] Chiến lược: Thừa kế hoàn toàn (Overwrite/Inherit) Quyền của Node sẽ
     * y hệt quyền của Parent.
     */
    private void applyInheritedPermissions(FileNode node, EPublicAccess parentPublic, List<FileNode.FilePermission> parentPerms) {
        // 1. Ghi đè Public Access
        // Nếu parent là null (Root của user) -> Mặc định là PRIVATE
        node.setPublicAccess(parentPublic != null ? parentPublic : EPublicAccess.PRIVATE);

        // 2. Ghi đè Permissions (Deep Copy)
        // Cần tạo list mới và object mới để không bị dính tham chiếu vùng nhớ
        if (parentPerms != null && !parentPerms.isEmpty()) {
            List<FileNode.FilePermission> newPerms = parentPerms.stream()
                    .map(p -> FileNode.FilePermission.builder()
                    .userId(p.getUserId())
                    .role(p.getRole())
                    .sharedAt(p.getSharedAt()) // Giữ nguyên thời điểm share gốc hoặc renew
                    .build())
                    .collect(Collectors.toList());
            node.setPermissions(newPerms);
        } else {
            node.setPermissions(new ArrayList<>()); // Reset về rỗng
        }
    }

    /**
     * Cập nhật đệ quy cho con cháu (Ancestors + Sync Permissions)
     */
    private void updateDescendantsRecursively(FileNode movedFolder) {
        // 1. Tìm tất cả con cháu
        List<FileNode> descendants = fileNodeRepository.findAllByAncestorsContainingAndIsDeletedFalse(movedFolder.getId());

        if (descendants.isEmpty()) {
            return;
        }

        // Chuẩn bị Ancestor Mới
        List<String> newParentAncestors = new ArrayList<>(movedFolder.getAncestors());
        newParentAncestors.add(movedFolder.getId());

        List<FileNode> toSave = new ArrayList<>();

        for (FileNode child : descendants) {
            // --- A. Cập nhật Ancestors (Giữ nguyên logic cũ) ---
            List<String> childAncestors = child.getAncestors();
            int index = childAncestors.indexOf(movedFolder.getId());
            if (index != -1) {
                List<String> suffix = childAncestors.subList(index + 1, childAncestors.size());
                List<String> newAncestors = new ArrayList<>(newParentAncestors);
                newAncestors.addAll(suffix);
                child.setAncestors(newAncestors);
            }

            // --- B. [SỬA] Cập nhật Permissions (Strict Inherit) ---
            // Ép toàn bộ con cháu phải theo quyền của Folder vừa di chuyển
            // (Vì movedFolder đã được cập nhật theo Target ở bước trước, nên con cháu sẽ theo Target)
            applyInheritedPermissions(
                    child,
                    movedFolder.getPublicAccess(),
                    movedFolder.getPermissions()
            );

            toSave.add(child);
        }

        // Batch Save & Sync ES
        if (!toSave.isEmpty()) {
            fileNodeRepository.saveAll(toSave);
            // Update ES để search được theo quyền mới và đường dẫn mới
            toSave.forEach(documentIndexService::updateElasticsearchMetadata);
        }
    }

    // =========================================================================
    // QUẢN LÝ THÙNG RÁC: MOVE TO TRASH, RESTORE, DELETE PERMANENTLY
    // =========================================================================
    /**
     * 1. CHUYỂN VÀO THÙNG RÁC (SOFT DELETE)
     */
    @Transactional
    public void moveToTrash(FileIdListRequest request, String userId) {
        List<FileNode> nodes = fileNodeRepository.findAllById(request.getIds());

        List<FileNode> toSave = new ArrayList<>();
        List<FileNode> toUpdateElastic = new ArrayList<>();

        for (FileNode node : nodes) {
            if (!permissionService.hasEditAccess(node, userId)) {
                throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
            }
            // A. Nếu KHÔNG PHẢI Owner -> Trả về thư mục gốc của chủ sở hữu (Logic mới)
            if (!node.getOwnerId().equals(userId)) {
                if (node.getType() == EFileType.FILE) {
                    node.setParentId(null);
                    node.setAncestors(new ArrayList<>());
                    node.setPublicAccess(EPublicAccess.PRIVATE);
                    node.setPermissions(new ArrayList<>()); // Reset share

                    fileNodeRepository.save(node);
                    documentIndexService.updateElasticsearchDeleteAndShareStatus(node);
                } else {
                    rescueRestoreOrphanFiles(node);
                }

                activityLogService.logTrashed(node, userId);

                continue; // Xong node này, không save vào list trash
            }

            // B. Nếu LÀ Owner -> Xử lý vào Thùng rác
            // 1. Đánh dấu xóa
            node.setDeleted(true);
            node.setTrashedAt(LocalDateTime.now());

            // 2. Lưu vết cha cũ
            node.setOriginalParentId(node.getParentId());

            // 3. Tách khỏi cây thư mục hiện tại (Về Root thùng rác)
            node.setParentId(null);

            activityLogService.logTrashed(node, userId);

            // Lưu ý: Ancestors GIỮ NGUYÊN để phục vụ search/restore về sau
            toSave.add(node);
            toUpdateElastic.add(node);

            // 4. Xử lý CON CHÁU (Nếu là Folder) -> Chỉ set isDeleted = true
            if (node.getType() == EFileType.FOLDER) {
                // Hàm này giữ nguyên như cũ: chỉ set isDeleted, không đổi parentId con cháu
                processDescendantsStatus(node, true, toSave, toUpdateElastic);
            }
        }

        if (!toSave.isEmpty()) {
            fileNodeRepository.saveAll(toSave);
        }

        // Sync ES
        toUpdateElastic.forEach(documentIndexService::updateElasticsearchDeleteStatus);
    }

    @Transactional
    public void restoreFiles(FileIdListRequest request, String userId) {
        List<FileNode> nodes = fileNodeRepository.findAllById(request.getIds());

        for (FileNode node : nodes) {
            // Chỉ Owner mới được khôi phục
            if (!permissionService.hasEditAccess(node, userId)) {
                continue;
            }

            // 1. Gỡ bỏ trạng thái xóa (Bước chung)
            node.setDeleted(false);
            node.setTrashedAt(null);

            // 2. PHÂN LOẠI TRƯỜNG HỢP (TH)
            boolean isRootRestore = (node.getOriginalParentId() == null && node.getParentId() == null);

            if (isRootRestore) {
                // --- TH1: ROOT TỪ ĐẦU ---
                node.setParentId(null);
                node.setOriginalParentId(null);
                fileNodeRepository.save(node);
                documentIndexService.updateElasticsearchDeleteAndShareStatus(node);

                // Khôi phục trạng thái con cháu (không đổi cấu trúc/quyền)
                if (node.getType() == EFileType.FOLDER) {
                    restoreDescendantsStatusOnly(node);
                }
            } else {
                // Kiểm tra cha cũ có tồn tại và không bị xóa không
                String parentId = node.getOriginalParentId() == null ? node.getParentId() : node.getOriginalParentId();
                Optional<FileNode> oldParentOpt = fileNodeRepository.findByIdAndIsDeletedFalse(parentId);

                if (oldParentOpt.isEmpty()) {
                    // --- TH2: CHA KHÔNG TỒN TẠI HOẶC ĐANG TRONG THÙNG RÁC ---
                    handleOrphanRestore(node);

                } else {
                    // --- TH3: CHA CÒN SỐNG ---
                    handleParentAliveRestore(node, oldParentOpt.get(), userId);
                }
            }

            activityLogService.logRestored(node, userId);
        }
    }

    private void handleOrphanRestore(FileNode node) {
        node.setOriginalParentId(null);
        if (node.getType() == EFileType.FILE) {
            node.setParentId(null);
            node.setAncestors(new ArrayList<>());
            node.setPublicAccess(EPublicAccess.PRIVATE);
            node.setPermissions(new ArrayList<>()); // Reset share

            fileNodeRepository.save(node);
            documentIndexService.updateElasticsearchDeleteAndShareStatus(node);
        } else {
            rescueRestoreOrphanFiles(node);
        }
    }

    /**
     * TH3: Cha còn sống - khôi phục về vị trí cũ và kế thừa quyền từ cha
     */
    private void handleParentAliveRestore(FileNode node, FileNode parent, String userId) {
        // 1. Kiểm tra user có quyền EDIT trong folder cha không
        if (!permissionService.hasEditAccess(parent, userId)) {
            // Không có quyền thì không thể restore về vị trí cũ
            // Có thể throw exception hoặc fallback về TH2
            handleOrphanRestore(node);
            return;
        }

        // 2. Lấy context từ cha (tương tự như khi tạo mới)
        FolderContext parentContext = getParentContext(parent.getId(), userId);

        // 3. Cập nhật thông tin node
        node.setParentId(parent.getId());
        node.setOriginalParentId(null);
        node.setAncestors(parentContext.getAncestors());
        node.setPublicAccess(parentContext.getPublicAccess());

        // 4. [QUAN TRỌNG] Cập nhật permissions từ parentContext
        // Context đã lọc bỏ "Thái thượng hoàng", chỉ giữ permissions cho người ngoài
        node.setPermissions(parentContext.getPermissions());

        // 5. Check trùng tên trong folder cha
        String originalName = node.getName();
        String uniqueName = generateUniqueFileName(parent.getId(), originalName, node.getOwnerId());
        if (!originalName.equals(uniqueName)) {
            node.setName(uniqueName);
        }

        FileNode savedNode = fileNodeRepository.save(node);
        documentIndexService.updateElasticsearchMetadataOnly(savedNode);

        // 6. Nếu là folder, cập nhật đệ quy cho con cháu
        if (node.getType() == EFileType.FOLDER) {
            updateDescendantsAfterRestore(savedNode, parentContext);
        }
    }

    /**
     * Cập nhật đệ quy cho con cháu sau khi restore (TH3)
     */
    private void updateDescendantsAfterRestore(FileNode parent, FolderContext parentContext) {
        // 1. Tìm tất cả con cháu
        List<FileNode> descendants = fileNodeRepository.findAllByAncestorsContaining(parent.getId());

        if (descendants.isEmpty()) {
            return;
        }

        // 2. Chuẩn bị ancestors mới cho các con
        List<String> newAncestors = new ArrayList<>(parentContext.getAncestors());
        newAncestors.add(parent.getId());

        List<FileNode> toSave = new ArrayList<>();

        for (FileNode child : descendants) {
            // Chỉ xử lý các node cùng owner với parent
            if (!child.getOwnerId().equals(parent.getOwnerId())) {
                continue;
            }

            // A. Cập nhật ancestors
            updateAncestorsForChild(child, parent.getId(), newAncestors);

            // B. Cập nhật permissions từ parent (đã lọc bỏ "Thái thượng hoàng")
            child.setPermissions(new ArrayList<>(parentContext.getPermissions()));

            // C. Cập nhật public access
            child.setPublicAccess(parentContext.getPublicAccess());

            // D. Khôi phục trạng thái nếu đang bị xóa
            if (child.isDeleted()) {
                child.setDeleted(false);
                child.setTrashedAt(null);
            }

            toSave.add(child);
        }

        // 3. Batch save và sync
        if (!toSave.isEmpty()) {
            fileNodeRepository.saveAll(toSave);
            toSave.forEach(documentIndexService::updateElasticsearchMetadataOnly);
        }
    }

    /**
     * Helper: Cập nhật ancestors cho một child dựa trên parent mới
     */
    private void updateAncestorsForChild(FileNode child, String parentId, List<String> newParentAncestors) {
        List<String> childAncestors = child.getAncestors();
        int index = childAncestors.indexOf(parentId);

        if (index != -1) {
            // Lấy phần suffix sau parentId trong ancestors cũ
            List<String> suffix = childAncestors.subList(index + 1, childAncestors.size());

            // Tạo ancestors mới = newParentAncestors + suffix
            List<String> newAncestors = new ArrayList<>(newParentAncestors);
            newAncestors.addAll(suffix);

            child.setAncestors(newAncestors);
        }
    }

    /**
     * Helper: Chỉ khôi phục trạng thái isDeleted cho con cháu. Chưa đụng vào
     * parentId hay ancestors.
     */
    private void restoreDescendantsStatusOnly(FileNode parent) {
        // Tìm con cháu dựa trên ancestors (Lưu ý: phải tìm cả những thằng đang isDeleted=true)
        List<FileNode> descendants = fileNodeRepository.findAllByAncestorsContaining(parent.getId());

        List<FileNode> toSave = new ArrayList<>();
        for (FileNode child : descendants) {
            // Chỉ restore những đứa bị xóa (thường là cùng thời điểm cha bị xóa)
            if (child.isDeleted()) {
                child.setDeleted(false);
                child.setTrashedAt(null);
                toSave.add(child);
            }
        }

        if (!toSave.isEmpty()) {
            fileNodeRepository.saveAll(toSave);
            toSave.forEach(documentIndexService::updateElasticsearchDeleteAndShareStatus);
        }
    }

    private void rescueRestoreOrphanFiles(FileNode parentFolder) {
        // 1. Tìm tất cả con cháu
        List<FileNode> descendants = fileNodeRepository.findAllByAncestorsContaining(parentFolder.getId());
        if (descendants.isEmpty()) {
            return;
        }

        Map<String, String> ownerMap = descendants.stream()
                .collect(Collectors.toMap(FileNode::getId, FileNode::getOwnerId));
        ownerMap.put(parentFolder.getId(), parentFolder.getOwnerId());

        // 2. Tìm các "Vết cắt" (Split Points)
        List<FileNode> splitNodes = new ArrayList<>();
        splitNodes.add(parentFolder);

        for (FileNode node : descendants) {
            String parentOwnerId = ownerMap.get(node.getParentId());

            // Logic cắt: Cha khác con -> Cắt
            if (parentOwnerId != null && !parentOwnerId.equals(node.getOwnerId())) {
                splitNodes.add(node);
            }
        }

        // -----------------------------------------------------------
        // BƯỚC 3: THỰC HIỆN CỨU (Sau khi đã dọn dẹp các node của mình)
        // -----------------------------------------------------------
        for (FileNode orphan : splitNodes) {
            // A. Đưa về Root của chủ sở hữu
            orphan.setParentId(null);
            orphan.setAncestors(new ArrayList<>());
            orphan.setDeleted(false);

            // B. Reset quyền
            orphan.setPublicAccess(EPublicAccess.PRIVATE);
            orphan.setPermissions(new ArrayList<>());

            // C. Lưu
            fileNodeRepository.save(orphan);
            documentIndexService.updateElasticsearchDeleteAndShareStatus(orphan);

            // D. Cập nhật con cháu
            if (orphan.getType() == EFileType.FOLDER) {
                restoreDescendantsStatus(orphan);
                updatePathAndPermissionsForSubtree(orphan, new ArrayList<>());
            }
        }
    }

    /**
     * 3. XOÁ VĨNH VIỄN (HARD DELETE)
     */
    @Transactional
    public void deletePermanently(FileIdListRequest request, String userId) {
        List<FileNode> nodes = fileNodeRepository.findAllById(request.getIds());

        for (FileNode node : nodes) {
            // Check quyền
            if (!node.getOwnerId().equals(userId)) {
                throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
            }

            // 1. CỨU FILE CON CỦA NGƯỜI KHÁC (Logic mới đã update ở bài trước)
            if (node.getType() == EFileType.FOLDER) {
                rescueOrphanFiles(node, userId);
            }

            activityLogService.logDeletedPermanently(node, userId);

            // 2. TIẾN HÀNH XOÁ
            deleteNodeAndDescendantsRecursively(node, userId);
        }
    }

    /**
     * Helper: Xoá vật lý Node và toàn bộ dữ liệu liên quan [UPDATE FIX]: Thêm
     * logic gọi Rescue đệ quy để cứu file lồng nhau.
     */
    private void deleteNodeAndDescendantsRecursively(FileNode rootNodeToDelete, String userId) {

        // 1. [QUAN TRỌNG] Gọi Rescue cho chính node này trước
        // Để nếu trong rootNodeToDelete có chứa con cháu của người khác (F4(C) trong F3(A)),
        // thì hàm rescue sẽ tách F4 ra khỏi F3 trước.
        if (rootNodeToDelete.getType() == EFileType.FOLDER) {
            rescueOrphanFiles(rootNodeToDelete, userId);
        }

        // 2. Tìm tất cả con cháu (Lúc này F4(C) đã bị tách đi rồi, danh sách sẽ sạch)
        List<FileNode> candidates = new ArrayList<>();
        if (rootNodeToDelete.getType() == EFileType.FOLDER) {
            candidates.addAll(fileNodeRepository.findAllByAncestorsContaining(rootNodeToDelete.getId()));
        }

        // --- ĐOẠN DƯỚI NÀY GIỮ NGUYÊN LOGIC LỌC THÙNG RÁC CŨ ---
        // A. Tìm các "Rào chắn" (Barrier)
        Set<String> excludedRootIds = candidates.stream()
                .filter(node -> node.isDeleted()
                && node.getParentId() == null
                && !node.getId().equals(rootNodeToDelete.getId()))
                .map(FileNode::getId)
                .collect(Collectors.toSet());

        // B. Lọc danh sách xoá
        List<FileNode> finalTargets = new ArrayList<>();
        finalTargets.add(rootNodeToDelete);

        for (FileNode node : candidates) {
            if (excludedRootIds.contains(node.getId())) {
                continue;
            }

            boolean isDescendantOfExcluded = node.getAncestors().stream()
                    .anyMatch(excludedRootIds::contains);

            if (isDescendantOfExcluded) {
                continue;
            }

            finalTargets.add(node);
        }

        // 3. TIẾN HÀNH XOÁ
        for (FileNode item : finalTargets) {
            if (item.getType() == EFileType.FILE) {
                if (item.getGridFsId() != null) {
                    deleteGridFsFile(item.getGridFsId());
                }
                deleteEncryptionKey(item.getEncryptionMetadata());
                cleanupFilePages(item.getId());

                pageAccessRequestRepository.deleteByFileId(item.getId());
                userPageAccessRepository.deleteByFileId(item.getId());
                recentFileRepository.deleteByFileId(item.getId());
                pageIndexRepository.deleteAllByFileId(item.getId());
            }
            documentIndexRepository.deleteById(item.getId());
        }

        fileNodeRepository.deleteAll(finalTargets);
    }

    /**
     * 4. LẤY DANH SÁCH THÙNG RÁC (HIỂN THỊ)
     */
    public List<FileResponse> getTrashFiles(String userId, String parentId) {
        List<FileNode> nodes;

        if (parentId == null || parentId.isEmpty() || "root".equals(parentId)) {
            // Lấy Root thùng rác (những file bị user bấm Delete trực tiếp)
            // Chúng có parentId = null và isDeleted = true
            nodes = fileNodeRepository.findByOwnerIdAndIsDeletedTrueAndParentIdIsNull(userId, Sort.by(Sort.Direction.DESC, "trashedAt"));
        } else {
            // Lấy nội dung bên trong 1 folder đang nằm trong thùng rác
            // Chúng có parentId = ID_FOLDER_RAC và isDeleted = true
            nodes = fileNodeRepository.findByParentIdAndIsDeletedTrue(parentId);
        }

        return nodes.stream()
                .map(node -> convertToResponse(node, userId))
                .collect(Collectors.toList());
    }

    /**
     * LẤY DANH SÁCH SHARED + RECENT (CÓ LOGIC NỔI BỌT THỜI GIAN & CHECK QUYỀN)
     */
    public List<FileResponse> getSharedFiles(String userId, int page, int limit) {
        // 1. TẬP HỢP DỮ LIỆU THÔ

        // A. Lấy Shared trực tiếp (Query này thường đã check permission trong DB, nhưng check lại cũng không thừa)
        List<FileNode> explicitSharedNodes = fileNodeRepository.findAllSharedWithUser(userId);

        // B. Lấy Recent (File của người khác)
        List<RecentFile> recentLogs = recentFileService.getRecentFilesByUser(userId);
        List<String> recentFileIds = recentLogs.stream().map(RecentFile::getFileId).collect(Collectors.toList());

        // Map thời gian truy cập
        Map<String, LocalDateTime> recentAccessMap = recentLogs.stream()
                .collect(Collectors.toMap(RecentFile::getFileId, RecentFile::getAccessedAt, (oldV, newV) -> newV));

        List<FileNode> recentNodes = new ArrayList<>();
        if (!recentFileIds.isEmpty()) {
            recentNodes = fileNodeRepository.findAllById(recentFileIds);
        }

        // 2. GỘP & LỌC QUYỀN (QUAN TRỌNG NHẤT)
        // Map: ID -> Node. Chỉ chứa những file user THỰC SỰ còn quyền xem
        Map<String, FileNode> scopeMap = new HashMap<>();

        // Helper gom nhóm để duyệt 1 lần
        List<FileNode> allCandidates = new ArrayList<>(explicitSharedNodes);
        allCandidates.addAll(recentNodes);

        for (FileNode node : allCandidates) {
            // A. Loại bỏ file trùng lặp (đã có trong map)
            if (scopeMap.containsKey(node.getId())) {
                continue;
            }

            // B. Loại bỏ file của chính mình (Tab này là "Được chia sẻ với tôi")
            if (node.getOwnerId().equals(userId)) {
                continue;
            }

            // C. Loại bỏ file đã xóa
            if (node.isDeleted()) {
                continue;
            }

            // D. [QUAN TRỌNG] Check quyền thực tế (Real-time Check)
            // Nếu quyền đã bị gỡ -> Bỏ qua ngay
            if (!permissionService.hasReadAccess(node, userId)) {
                continue;
            }

            scopeMap.put(node.getId(), node);
        }

        if (scopeMap.isEmpty()) {
            return new ArrayList<>();
        }

        // 3. TÍNH TOÁN THỜI GIAN CƠ SỞ (BASE TIME)
        Map<String, LocalDateTime> effectiveTimeMap = new HashMap<>();

        for (FileNode node : scopeMap.values()) {
            // Lấy thời gian: SharedAt (nếu có) hoặc AccessedAt (nếu có) hoặc UpdatedAt
            LocalDateTime baseTime = getBaseInteractionTime(node, userId, recentAccessMap);
            effectiveTimeMap.put(node.getId(), baseTime);
        }

        // 4. LAN TRUYỀN THỜI GIAN LÊN CHA (BUBBLE UP)
        // Logic: Nếu con mới hơn cha -> Cha nổi lên đầu
        for (FileNode node : scopeMap.values()) {
            LocalDateTime myTime = effectiveTimeMap.get(node.getId());

            if (node.getAncestors() != null) {
                for (String ancestorId : node.getAncestors()) {
                    // Chỉ cập nhật nếu cha cũng nằm trong danh sách được phép thấy (scopeMap)
                    if (scopeMap.containsKey(ancestorId)) {
                        effectiveTimeMap.merge(ancestorId, myTime,
                                (parentTime, childTime) -> childTime.isAfter(parentTime) ? childTime : parentTime);
                    }
                }
            }
        }

        // 5. LỌC GỐC (VISUAL ROOT) & SẮP XẾP
        // Visual Root: Là node mà cha của nó KHÔNG nằm trong danh sách hiển thị
        List<FileNode> rootNodes = scopeMap.values().stream()
                .filter(node -> {
                    if (node.getParentId() == null) {
                        return true;
                    }
                    // Nếu cha có tồn tại nhưng user không có quyền xem cha -> Node này trở thành Root ảo
                    return !scopeMap.containsKey(node.getParentId());
                })
                .sorted((n1, n2) -> {
                    LocalDateTime t1 = effectiveTimeMap.get(n1.getId());
                    LocalDateTime t2 = effectiveTimeMap.get(n2.getId());
                    return t2.compareTo(t1); // Mới nhất lên đầu
                })
                .collect(Collectors.toList());

        // 6. PHÂN TRANG (PAGINATION IN MEMORY)
        int start = page * limit;
        int end = Math.min((start + limit), rootNodes.size());

        if (start >= rootNodes.size()) {
            return new ArrayList<>();
        }

        List<FileNode> pagedList = rootNodes.subList(start, end);

        // 7. FETCH THÔNG TIN OWNER (BATCH)
        Set<String> ownerIds = pagedList.stream()
                .map(FileNode::getOwnerId)
                .collect(Collectors.toSet());

        List<User> owners = userRepository.findAllById(ownerIds);
        Map<String, User> ownerMap = owners.stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        // 8. MAP TO RESPONSE
        return pagedList.stream().map(node -> {
            FileResponse dto = convertToResponse(node, userId);

            User owner = ownerMap.get(node.getOwnerId());
            if (owner != null) {
                dto.setOwnerName(owner.getFullName());
                dto.setOwnerAvatar(owner.getAvatarUrl());
                dto.setOwnerEmail(owner.getEmail());
            } else {
                dto.setOwnerName("Unknown User");
            }

            // Trả về thời gian sắp xếp để Frontend hiển thị (VD: "Cập nhật 2 phút trước")
            dto.setSharedAt(effectiveTimeMap.get(node.getId()));

            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * WRAPPER 2: Xử lý Copy (Từ File cũ)
     */
    @Transactional
    public FileResponse copyFile(String fileId, String userId) throws Exception {
        // A. Lấy & Validate File Gốc
        FileNode sourceNode = fileNodeRepository.findByIdAndIsDeletedFalse(fileId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        if (sourceNode.getType() != EFileType.FILE) {
            throw new AppException(AppErrorCode.COPY_FOLDER);
        }

        // Check quyền Đọc (Cần đọc để giải mã)
        if (!permissionService.hasReadAccess(sourceNode, userId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        validateDownloadOrCopyPermission(sourceNode, userId);

        // B. Xác định vị trí & Tên mới
        String parentId = sourceNode.getParentId();
        // Logic kiểm tra quyền ghi vào folder cha (như cũ)...
        if (parentId != null) {
            FileNode parent = fileNodeRepository.findById(parentId).orElse(null);
            if (parent != null && !permissionService.hasEditAccess(parent, userId)) {
                parentId = null;
            }
        }

        String prefix = "Bản sao của ";
        String baseName = sourceNode.getName().startsWith(prefix) ? sourceNode.getName() : prefix + sourceNode.getName();
        String uniqueName = generateUniqueFileName(parentId, baseName, userId);
        FolderContext context = getParentContext(parentId, userId);

        // C. Chuẩn bị dữ liệu từ file gốc
        // Lấy nội dung đã giải mã từ GridFS ra byte array
        byte[] fileBytes = getDecryptedBytes(sourceNode);

        // Trích xuất lại text (Hoặc có thể query lấy text cũ từ ElasticSearch để tiết kiệm CPU)
        String extractedContent = "";
        try (InputStream tikaStream = new ByteArrayInputStream(fileBytes)) {
            extractedContent = tika.parseToString(tikaStream);
        } catch (Exception e) {
            /* Ignore */ }

        // D. Gọi hàm chung
        try (InputStream saveStream = new ByteArrayInputStream(fileBytes)) {
            FileResponse response = internalStoreFile(
                    saveStream,
                    uniqueName,
                    sourceNode.getMimeType(),
                    sourceNode.getSize(),
                    context,
                    userId,
                    sourceNode.getDescription(),
                    extractedContent
            );

            FileNode copiedNode = fileNodeRepository.findByIdAndIsDeletedFalse(response.getId())
                    .orElse(null);

            if (copiedNode != null) {
                activityLogService.logCopied(sourceNode, copiedNode, userId);
            }

            return response;
        }
    }

    // --- SAVE AVATAR FILE ---
    /**
     * Hàm lưu file vào GridFS và trả về URL tải file Được sử dụng trong
     * updateProfile để lưu Avatar
     */
    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new AppException(AppErrorCode.EMPTY_FILE_SAVE);
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
            throw new AppException(AppErrorCode.GRIDFS_SAVE_ERROR);
        }
    }

    /**
     * Hàm lấy Resource từ GridFS để Controller trả về cho Client xem
     */
    public GridFSFile getFile(String id) {
        try {
            return gridFsTemplate.findOne(new Query(Criteria.where("_id").is(id)));
        } catch (Exception e) {
            throw new AppException(AppErrorCode.FILE_NOT_FOUND_INTERNAL);
        }
    }

    /**
     * Hàm xóa file khỏi GridFS
     */
    public void deleteFile(String id) {
        if (id == null || id.isEmpty()) {
            return;
        }

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
            throw new AppException(AppErrorCode.INVALID_RENAME_FOLDER_REQUEST);
        }

        // C. Check Quyền
        if (!permissionService.hasEditAccess(folder, userId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        String oldName = folder.getName();

        // D. Nếu tên không đổi -> Return luôn
        if (oldName.equals(newName)) {
            return convertToResponse(folder, userId);
        }

        // E. Check trùng tên
        checkDuplicateName(folder.getParentId(), newName, id, EFileType.FOLDER);

        // F. Cập nhật & Save DB
        folder.setName(newName);
        // Folder không có extension, hoặc extension rỗng

        FileNode savedNode = fileNodeRepository.save(folder);

        // G. Cập nhật Elasticsearch (Logic tối ưu)
        documentIndexService.updateElasticsearchAfterRename(savedNode);

        activityLogService.logRenamed(savedNode, oldName, userId);

        return convertToResponse(savedNode, userId);
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
            throw new AppException(AppErrorCode.INVALID_RENAME_FILE_REQUEST);
        }

        // C. Check Quyền
        if (!permissionService.hasEditAccess(fileNode, userId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        String oldName = fileNode.getName();

        // --- [FIX] LOGIC XỬ LÝ ĐUÔI FILE (EXTENSION) ---
        // 1. Lấy extension hiện tại và đảm bảo nó có dấu chấm (VD: "txt" -> ".txt")
        String currentExt = fileNode.getExtension();
        if (currentExt == null) {
            currentExt = "";
        }
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
        if (oldName.equals(finalName)) {
            return convertToResponse(fileNode, userId);
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
        documentIndexService.updateElasticsearchAfterRename(savedNode);

        activityLogService.logRenamed(savedNode, oldName, userId);

        return convertToResponse(savedNode, userId);
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
        if (!permissionService.hasEditAccess(node, userId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        // C. Chuẩn hóa mô tả (Tránh null)
        String newDesc = description == null ? "" : description.trim();

        // D. Nếu không thay đổi -> Return luôn
        String oldDesc = node.getDescription() == null ? "" : node.getDescription();
        if (oldDesc.equals(newDesc)) {
            return convertToResponse(node, userId);
        }

        // E. Cập nhật & Save DB
        node.setDescription(newDesc);
        FileNode savedNode = fileNodeRepository.save(node);

        // F. Cập nhật Elasticsearch
        documentIndexService.updateElasticsearchDescription(savedNode);

        activityLogService.logDescriptionUpdated(savedNode, oldDesc, userId);

        return convertToResponse(savedNode, userId);
    }

    /**
     * LẤY CHI TIẾT FILE (Đầy đủ thông tin user, đường dẫn...)
     */
    public FileDetailResponse getFileDetails(String id, String userId) {
        // 1. Tìm Node
        FileNode node = fileNodeRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        // 2. Check Quyền (Cần ít nhất là quyền VIEW để xem thông tin)
        if (!permissionService.hasReadAccess(node, userId)) {
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

        // B. [MỚI] Lấy ID của các "Thái Thượng Hoàng" (Owner của Ancestors)
        // Map: UserId -> Role (Để hiển thị họ là "Owner (Inherited)")
        Map<String, String> ancestorOwners = new HashMap<>();
        if (node.getAncestors() != null && !node.getAncestors().isEmpty()) {
            List<FileNode> ancestors = fileNodeRepository.findAllById(node.getAncestors());
            for (FileNode ancestor : ancestors) {
                // Thêm Owner của cha vào danh sách cần fetch info
                userIdsToFetch.add(ancestor.getOwnerId());
                // Lưu lại để lát nữa đánh dấu
                if (!ancestor.getOwnerId().equals(node.getOwnerId())) {
                    ancestorOwners.put(ancestor.getOwnerId(), "INHERITED_OWNER");
                }
            }
        }

        // 4. LẤY MAP USER TỪ DB (1 Query duy nhất)
        // Giả sử bạn có UserService hoặc UserRepository. Nếu là Microservices thì gọi UserClient.
        Map<String, FileDetailResponse.UserSummary> userMap = getUsersSummaryMap(userIdsToFetch);

        // 5. XÂY DỰNG CHUỖI ĐƯỜNG DẪN (LOCATION PATH)
        String path = buildLocationPath(node.getAncestors());

        // 6. BUILD PERMISSIONS LIST
        List<FileDetailResponse.PermissionDetail> sharedList = new ArrayList<>();

        for (String ancestorOwnerId : ancestorOwners.keySet()) {
            sharedList.add(FileDetailResponse.PermissionDetail.builder()
                    .user(userMap.get(ancestorOwnerId))
                    .permissionType("INHERITED_OWNER") // Enum giả hoặc String để FE hiển thị badge "Chủ sở hữu (Thư mục cha)"
                    .build());
        }

        if (node.getPermissions() != null) {
            List<FileDetailResponse.PermissionDetail> explicitPerms = node.getPermissions().stream()
                    // Lọc: Nếu user này đã nằm trong nhóm Thái Thượng Hoàng rồi thì thôi không hiện lại quyền Editor/Viewer nữa
                    // (Hoặc tùy nghiệp vụ, có thể hiện đè lên. Nhưng thường quyền Owner to nhất nên giữ Owner).
                    .filter(p -> !ancestorOwners.containsKey(p.getUserId()))
                    .map(p -> FileDetailResponse.PermissionDetail.builder()
                    .user(userMap.get(p.getUserId()))
                    .permissionType(p.getRole().name())
                    .build())
                    .collect(Collectors.toList());

            sharedList.addAll(explicitPerms);
        }

        UserPermissions userPermissions = calculateUserPermissions(node, userId);

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
                .permissions(userPermissions)
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
     * Helper: Tự xử lý việc map User Entity -> UserSummary DTO (Không cần gọi
     * qua UserService nữa)
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
    /**
     * Đệ quy cập nhật trạng thái deleted cho toàn bộ con cháu. Dùng cho cả
     * MoveToTrash (isDeleted=true) và Restore (isDeleted=false).
     */
    private void processDescendantsStatus(FileNode parent, boolean isDeleted, List<FileNode> toSave, List<FileNode> toUpdateES) {
        // Tìm tất cả con cháu (ancestors vẫn còn nguyên nên tìm tốt)
        List<FileNode> descendants = fileNodeRepository.findAllByAncestorsContaining(parent.getId());

        for (FileNode child : descendants) {
            // Chỉ update trạng thái, KHÔNG thay đổi cấu trúc cây (parentId, ancestors)
            child.setDeleted(isDeleted);

            if (isDeleted) {
                child.setTrashedAt(parent.getTrashedAt());
            } else {
                child.setTrashedAt(null);
            }

            toSave.add(child);
            toUpdateES.add(child);
        }
    }

    /**
     * Trả file về Root của chủ sở hữu (Khi người khác xoá file mình share)
     */
    private void returnToOwnerRoot(FileNode node, String actorId) {
        if (!permissionService.hasEditAccess(node, actorId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }
        node.setParentId(null);
        node.setAncestors(new ArrayList<>());

        // Nếu là Folder, update lại đường dẫn cho con cháu (Hàm này lấy từ code Move)
        if (node.getType() == EFileType.FOLDER) {
            updateDescendantsAncestors(node); // Đảm bảo bạn đã có hàm này từ code Move trước đó
        }
    }

    /**
     * Cứu các file con "mồ côi" (Rescue Orphan) - Logic Đa Tầng [FIXED]
     */
    private void rescueOrphanFiles(FileNode parentFolder, String deleterId) {
        // 1. Tìm tất cả con cháu
        List<FileNode> descendants = fileNodeRepository.findAllByAncestorsContaining(parentFolder.getId());
        if (descendants.isEmpty()) {
            return;
        }

        Map<String, String> ownerMap = descendants.stream()
                .collect(Collectors.toMap(FileNode::getId, FileNode::getOwnerId));
        ownerMap.put(parentFolder.getId(), parentFolder.getOwnerId());

        // 2. Tìm các "Vết cắt" (Split Points)
        List<FileNode> splitNodes = new ArrayList<>();

        for (FileNode node : descendants) {
            // LƯU Ý QUAN TRỌNG: Không bỏ qua node của deleter ở bước này nữa
            // Vì nếu F3(A) nằm trong F2(B), nó là một Split Point cần được xử lý (Xoá)

            String parentOwnerId = ownerMap.get(node.getParentId());

            // Logic cắt: Cha khác con -> Cắt
            if (parentOwnerId != null && !parentOwnerId.equals(node.getOwnerId())) {
                splitNodes.add(node);
            }
        }

        // 3. PHÂN LOẠI & XỬ LÝ
        // A. Nhóm cần XOÁ NGAY (Của chính người đang xoá nhưng nằm "nhầm chỗ" trong folder người khác)
        List<FileNode> nodesToDelete = splitNodes.stream()
                .filter(n -> n.getOwnerId().equals(deleterId))
                .collect(Collectors.toList());

        // B. Nhóm cần CỨU (Của người khác)
        List<FileNode> nodesToRescue = splitNodes.stream()
                .filter(n -> !n.getOwnerId().equals(deleterId))
                .collect(Collectors.toList());

        // -----------------------------------------------------------
        // BƯỚC 4.1: THỰC HIỆN XOÁ TRƯỚC (Để tránh việc nó bị update path sai lệch)
        // -----------------------------------------------------------
        for (FileNode node : nodesToDelete) {
            // Gọi đệ quy hàm xoá vĩnh viễn cho nhánh con này
            // Lưu ý: Nếu trong nhánh này lại có con của người khác (F4(C)),
            // hàm deleteNode... sẽ lại gọi rescueOrphanFiles để cứu F4(C). -> Logic đệ quy hoàn hảo.
            deleteNodeAndDescendantsRecursively(node, deleterId);
        }

        // -----------------------------------------------------------
        // BƯỚC 4.2: THỰC HIỆN CỨU (Sau khi đã dọn dẹp các node của mình)
        // -----------------------------------------------------------
        for (FileNode orphan : nodesToRescue) {
            // Kiểm tra lại xem node này còn tồn tại không (phòng trường hợp nó là con của nodesToDelete vừa xoá)
            // Tuy nhiên với logic Split Point thì nodesToRescue và nodesToDelete là ngang hàng (siblings)
            // hoặc khác nhánh, nên ít khi ảnh hưởng nhau. Nhưng cẩn thận vẫn hơn.
            if (!fileNodeRepository.existsById(orphan.getId())) {
                continue;
            }

            // A. Đưa về Root của chủ sở hữu
            orphan.setParentId(null);
            orphan.setAncestors(new ArrayList<>());
            orphan.setDeleted(false);

            // B. Reset quyền
            orphan.setPublicAccess(EPublicAccess.PRIVATE);
            orphan.setPermissions(new ArrayList<>());

            // C. Lưu
            fileNodeRepository.save(orphan);
            documentIndexService.updateElasticsearchDeleteAndShareStatus(orphan);

            // D. Cập nhật con cháu
            if (orphan.getType() == EFileType.FOLDER) {
                restoreDescendantsStatus(orphan);
                updatePathAndPermissionsForSubtree(orphan, new ArrayList<>());
            }
        }
    }

    /**
     * Hàm MỚI: Chỉ cập nhật Ancestors (Đường dẫn) cho con cháu. Dùng cho các
     * trường hợp: 1. Trả file về Root (Return to Owner). 2. Cứu file mồ côi
     * (Rescue Orphan). 3. Chuyển vào thùng rác (nếu cần cập nhật đường dẫn con
     * cháu theo logic tách folder).
     */
    private void updateDescendantsAncestors(FileNode movedFolder) {
        // 1. Tìm tất cả con cháu (bao gồm cả file đã xóa để đảm bảo tính nhất quán)
        List<FileNode> descendants = fileNodeRepository.findAllByAncestorsContaining(movedFolder.getId());

        if (descendants.isEmpty()) {
            return;
        }

        // 2. Tính toán Ancestors cơ sở mới từ Folder cha vừa di chuyển
        // (Nếu movedFolder về Root, list này chỉ chứa [movedFolderId])
        List<String> newParentAncestors = new ArrayList<>(movedFolder.getAncestors());
        newParentAncestors.add(movedFolder.getId());

        List<FileNode> toSave = new ArrayList<>();

        for (FileNode child : descendants) {
            List<String> childAncestors = child.getAncestors();

            // Tìm vị trí của folder cha trong đường dẫn cũ của con
            int index = childAncestors.indexOf(movedFolder.getId());

            if (index != -1) {
                // Giữ lại phần đuôi đường dẫn (cấu trúc con bên trong movedFolder)
                List<String> suffix = childAncestors.subList(index + 1, childAncestors.size());

                // Tạo đường dẫn mới: [Ancestors Mới của Cha] + [Suffix Cũ]
                List<String> newAncestors = new ArrayList<>(newParentAncestors);
                newAncestors.addAll(suffix);

                child.setAncestors(newAncestors);

                // Thêm vào danh sách cần lưu
                toSave.add(child);
            }
        }

        // 3. Lưu Batch xuống DB và cập nhật ElasticSearch
        if (!toSave.isEmpty()) {
            fileNodeRepository.saveAll(toSave);

            // Cập nhật Metadata sang Elastic để đảm bảo tìm kiếm theo vị trí vẫn đúng
            toSave.forEach(documentIndexService::updateElasticsearchMetadata);
        }
    }

    /**
     * Helper: Tính thời gian cơ sở của riêng node đó Max(SharedAt, AccessedAt)
     */
    private LocalDateTime getBaseInteractionTime(FileNode node, String userId, Map<String, LocalDateTime> recentAccessMap) {
        // A. Thời gian được Share
        LocalDateTime sharedAt = LocalDateTime.MIN;
        if (node.getPermissions() != null) {
            sharedAt = node.getPermissions().stream()
                    .filter(p -> p.getUserId().equals(userId))
                    .findFirst()
                    .map(FileNode.FilePermission::getSharedAt)
                    .orElse(LocalDateTime.MIN);
        }

        // B. Thời gian truy cập gần đây
        LocalDateTime accessedAt = recentAccessMap.getOrDefault(node.getId(), LocalDateTime.MIN);

        // C. Trả về max
        return sharedAt.isAfter(accessedAt) ? sharedAt : accessedAt;
    }

    /**
     * MAIN METHOD: Chuyển đổi Entity -> Response DTO
     */
    public FileResponse convertToResponse(FileNode node, String currentUserId) {
        FileResponse response = modelMapper.map(node, FileResponse.class);

        // 1. Fill Owner Info (Dùng cache hoặc map nếu list lớn)
        userRepository.findById(node.getOwnerId()).ifPresent(owner -> {
            response.setOwnerName(owner.getFullName());
            response.setOwnerAvatar(owner.getAvatarUrl());
            response.setOwnerEmail(owner.getEmail());
        });

        // 2. Fill SharedAt (Thời điểm được share)
        // Tìm trong permissions xem user hiện tại được share lúc nào
        if (node.getPermissions() != null) {
            node.getPermissions().stream()
                    .filter(p -> p.getUserId().equals(currentUserId))
                    .findFirst()
                    .ifPresent(p -> response.setSharedAt(p.getSharedAt()));
        }

        // 3. [CORE] TÍNH TOÁN QUYỀN HẠN (FEUDAL SYSTEM)
        UserPermissions permissions = calculateUserPermissions(node, currentUserId);
        response.setPermissions(permissions);

        return response;
    }

    /**
     * CLEAN CODE: Tính toán quyền hạn dựa trên Role
     */
    private UserPermissions calculateUserPermissions(FileNode node, String userId) {
        // A. Nếu file đã xóa vào thùng rác
        if (node.isDeleted()) {
            // Chỉ chủ sở hữu (hoặc Lãnh chúa) mới có quyền trong thùng rác
            boolean isOwnerOrLandlord = node.getOwnerId().equals(userId) || permissionService.isLandlord(node, userId);
            if (isOwnerOrLandlord) {
                return UserPermissions.builder()
                        .canViewDetails(true)
                        .canDelete(true) // Delete Forever
                        .canDeletePermanently(true)
                        .canRestore(true)
                        .build();
            }
            return UserPermissions.noPermissions();
        }

        // B. Xác định Vai trò (Role) của User đối với Node này
        EPermissionRole effectiveRole = resolveEffectiveRole(node, userId);

        if (effectiveRole == null) {
            return UserPermissions.noPermissions();
        }

        // C. Build permissions dựa trên Role và Loại file
        return buildPermissionsByRole(effectiveRole, node.getType());
    }

    /**
     * HELPER 1: Xác định cấp bậc (Rank) của User Thứ tự ưu tiên: Owner/Landlord
     * > Editor > Viewer
     */
    private EPermissionRole resolveEffectiveRole(FileNode node, String userId) {
        // 1. Cấp cao nhất: LÃNH CHÚA (Landlord) hoặc CHỦ SỞ HỮU (Owner)
        // isLandlord check cả Ancestor Owners (Thái Thượng Hoàng)
        if (permissionService.isLandlord(node, userId)) {
            return EPermissionRole.EDITOR; // Mượn Enum OWNER đại diện cho quyền lực tối cao
        }

        // 2. Cấp tiếp theo: EDITOR (Được share quyền sửa hoặc Public Edit)
        if (permissionService.hasEditAccess(node, userId)) {
            return EPermissionRole.EDITOR;
        }

        // 3. Cấp thấp nhất: VIEWER (Được share quyền xem hoặc Public View)
        if (permissionService.hasReadAccess(node, userId)) {
            return EPermissionRole.VIEWER;
        }

        // 4. Người dưng
        return null;
    }

    /**
     * HELPER 2: Bật/Tắt các cờ quyền hạn dựa trên Role
     */
    private UserPermissions buildPermissionsByRole(EPermissionRole role, EFileType fileType) {
        UserPermissions.UserPermissionsBuilder builder = UserPermissions.builder();
        boolean isFolder = (fileType == EFileType.FOLDER);

        // --- NHÓM QUYỀN CƠ BẢN (Viewer cũng có) ---
        builder.canViewDetails(true)
                .canCopyLink(true)
                .canDownload(!isFolder)
                // Folder không copy được, File copy được
                .canCopy(!isFolder);

        // --- NHÓM QUYỀN CHỈNH SỬA (Editor trở lên) ---
        if (role == EPermissionRole.EDITOR) {
            builder.canRename(true)
                    .canUpdateDescription(true)
                    .canMove(true)
                    .canShare(true); // Editor được phép share tiếp (theo logic lan truyền xuống)

            if (isFolder) {
                builder.canUploadFile(true)
                        .canUploadFolder(true)
                        .canCreateFolder(true);
            }
        } else {
            // Viewer không làm được gì thêm
            builder.canRename(false).canMove(false).canShare(false)
                    .canUploadFile(false).canUploadFolder(false).canCreateFolder(false);
        }

        // --- NHÓM QUYỀN SINH SÁT (Chỉ Owner/Landlord) ---
        // Trong hệ thống Feudal: Chỉ Vua (Owner/Landlord) mới được xoá file.
        // Quan lại (Editor) chỉ được sửa nội dung, không được xoá node.
        if (role == EPermissionRole.EDITOR) {
            builder.canDelete(true) // Soft delete
                    .canDeletePermanently(false) // Hard delete thường chỉ làm trong thùng rác
                    .canRestore(false); // Restore chỉ làm trong thùng rác
        } else {
            builder.canDelete(false);
        }

        return builder.build();
    }

    /**
     * Helper: Lấy nội dung file đã giải mã dưới dạng byte array (Cần thiết vì
     * Tika và Processor cần đọc dữ liệu raw)
     */
    private byte[] getDecryptedBytes(FileNode fileNode) throws Exception {
        FileNode.EncryptionMetadata encMeta = fileNode.getEncryptionMetadata();
        if (encMeta == null || !fileNode.isEncrypted()) {
            throw new AppException(AppErrorCode.FILE_ENCRYPTION_METADATA_ERROR);
        }

        // 1. Lấy Key giải mã
        FileKey fileKeyEntity = fileKeyRepository.findById(encMeta.getKeyId())
                .orElseThrow(() -> new AppException(AppErrorCode.KEY_NOT_EXIST));

        SecretKey originalFileKey = cryptoUtils.decryptFileKey(fileKeyEntity.getEncryptedKey());
        byte[] iv = cryptoUtils.decodeBase64(encMeta.getIv());

        // 2. Lấy Stream từ GridFS
        GridFSFile gridFSFile = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(fileNode.getGridFsId())));
        if (gridFSFile == null) {
            throw new AppException(AppErrorCode.FILE_NOT_FOUND);
        }

        GridFsResource gridFsResource = gridFsTemplate.getResource(gridFSFile);

        // 3. Giải mã
        try (InputStream encryptedStream = gridFsResource.getInputStream()) {
            Cipher decryptCipher = cryptoUtils.getDecryptCipher(originalFileKey, iv);
            try (CipherInputStream decryptedStream = new CipherInputStream(encryptedStream, decryptCipher)) {
                // Đọc toàn bộ stream ra byte array
                return decryptedStream.readAllBytes();
            }
        }
    }

    /**
     * Helper: Xoá toàn bộ dữ liệu trang (Ảnh rõ, Ảnh mờ, Key của trang)
     */
    private void cleanupFilePages(String fileId) {
        List<FilePage> pages = filePageRepository.findAllByFileId(fileId);

        if (pages.isEmpty()) {
            return;
        }

        for (FilePage page : pages) {
            // 1. Xoá ảnh trong GridFS
            deleteGridFsFile(page.getClearGridFsId());
            deleteGridFsFile(page.getBlurredGridFsId());

            // 2. Xoá Key mã hoá riêng của từng trang (Nếu có)
            // Lưu ý: Nếu trang dùng chung key với file gốc thì không cần xoá (tuỳ logic tạo key của bạn)
            // Nhưng nếu mỗi trang một key riêng (để share lẻ) thì phải xoá.
            deleteEncryptionKey(page.getClearEncryptionData());
            deleteEncryptionKey(page.getBlurredEncryptionData());
        }

        // 3. Xoá metadata trang
        filePageRepository.deleteAll(pages);
    }

    /**
     * Helper: Xoá file trong GridFS an toàn
     */
    private void deleteGridFsFile(String gridFsId) {
        if (gridFsId == null || gridFsId.isEmpty()) {
            return;
        }
        try {
            gridFsTemplate.delete(new Query(Criteria.where("_id").is(gridFsId)));
        } catch (Exception e) {
            // Log warning nhưng không throw lỗi để quy trình xoá tiếp tục
            System.err.println("Warning: Không tìm thấy GridFS ID " + gridFsId + " để xoá.");
        }
    }

    /**
     * Helper: Xoá Key mã hoá an toàn
     */
    private void deleteEncryptionKey(FileNode.EncryptionMetadata metadata) {
        if (metadata != null && metadata.getKeyId() != null) {
            try {
                fileKeyRepository.deleteById(metadata.getKeyId());
            } catch (Exception e) {
                /* Ignore */ }
        }
    }

    // Helper check preview support
    private boolean isSupportPreview(String mimeType) {
        return mimeType.equals("application/pdf")
                || mimeType.contains("word")
                || mimeType.contains("officedocument");
    }

    /**
     * HELPER: Kiểm tra xem User có đủ quyền tải toàn bộ file không Logic: User
     * phải sở hữu quyền truy cập cho TẤT CẢ các trang đang bị khoá.
     */
    private void validateDownloadOrCopyPermission(FileNode fileNode, String userId) {
        // 1. Chủ sở hữu luôn được phép
        if (fileNode.getOwnerId().equals(userId)) {
            return;
        }

        // 2. Lấy danh sách các trang đang bị khoá (Chỉ lấy field pageIndex)
        // Kết quả ví dụ: [0, 5, 10]
        List<Integer> lockedIndices = filePageRepository.findLockedPagesByFileId(fileNode.getId())
                .stream().map(FilePage::getPageIndex).toList();

        // Nếu không có trang nào bị khoá -> Public -> Cho phép tải
        if (lockedIndices.isEmpty()) {
            return;
        }

        // 3. Lấy danh sách các trang User có quyền
        // Kết quả ví dụ: [0, 1, 2, 5]
        Set<Integer> userAccessIndices = userPageAccessRepository.findGrantedPagesByUserIdAndFileId(userId, fileNode.getId())
                .stream().map(UserPageAccess::getPageIndex).collect(Collectors.toSet());

        // 4. SO SÁNH: Kiểm tra xem User có thiếu trang nào không
        // Duyệt qua tất cả trang khoá, nếu có bất kỳ trang nào User không có quyền -> CHẶN
        for (Integer lockedIndex : lockedIndices) {
            if (!userAccessIndices.contains(lockedIndex)) {
                throw new AppException(AppErrorCode.FORBIDDEN_DOWNLOAD_OR_COPY_LOCKED);
                // Message: "Bạn cần mở khoá toàn bộ các trang để tải xuống tệp tin này."
            }
        }
    }

    /**
     * Helper 1: Hồi sinh trạng thái deleted cho con cháu (Recursively) Chỉ
     * update cờ isDeleted, không đụng vào parentId/ancestors
     */
    private void restoreDescendantsStatus(FileNode parent) {
        // Tìm con cháu dựa trên ancestors cũ (lưu ý: logic tìm này cần chính xác)
        // Khi F4 vào thùng rác, ancestors của F5 vẫn chứa F4.
        // Nên ta tìm theo ID của cha (parent.getId()) nằm trong ancestors của con.
        List<FileNode> descendants = fileNodeRepository.findAllByAncestorsContaining(parent.getId());

        for (FileNode child : descendants) {
            if (child.isDeleted()) { // Chỉ khôi phục những đứa bị xóa cùng đợt (check trashedAt nếu cần kỹ hơn)
                child.setDeleted(false);
                fileNodeRepository.save(child);
                documentIndexService.updateElasticsearchDeleteStatus(child);
            }
        }
    }

    /**
     * Helper 2: Cập nhật Ancestors VÀ Permissions cho toàn bộ cây con. Logic:
     * Con cháu sẽ thừa hưởng hoàn toàn quyền của rootNode vừa khôi phục.
     */
    private void updatePathAndPermissionsForSubtree(FileNode rootNode, List<String> rootNewAncestors) {
        List<FileNode> descendants = fileNodeRepository.findAllByAncestorsContaining(rootNode.getId());

        for (FileNode child : descendants) {
            // 1. CẬP NHẬT ĐƯỜNG DẪN (Logic cũ giữ nguyên)
            List<String> oldAncestors = child.getAncestors();
            int pivotIndex = oldAncestors.indexOf(rootNode.getId());

            if (pivotIndex != -1) {
                List<String> relativePath = oldAncestors.subList(pivotIndex + 1, oldAncestors.size());
                List<String> newChildAncestors = new ArrayList<>(rootNewAncestors);
                newChildAncestors.add(rootNode.getId());
                newChildAncestors.addAll(relativePath);
                child.setAncestors(newChildAncestors);
            }

            // 2. [MỚI] CẬP NHẬT QUYỀN (Inherit from Root Node)
            // Ép toàn bộ con cháu theo quyền của Node cha vừa khôi phục
            child.setPublicAccess(rootNode.getPublicAccess());
            if (rootNode.getPermissions() != null) {
                child.setPermissions(new ArrayList<>(rootNode.getPermissions()));
            } else {
                child.setPermissions(new ArrayList<>());
            }

            // 3. Lưu & Sync ES
            fileNodeRepository.save(child);

            // Hàm này của bạn đã update cả deleted, ancestors và permission (allowedUsers) -> Rất tốt
            documentIndexService.updateElasticsearchDeleteAndShareStatus(child);
        }
    }

    /**
     * Thay thế cho findByIdAndUserAccess Hàm này chịu trách nhiệm lấy file VÀ
     * ném lỗi nếu không có quyền
     */
    public FileNode getFileAndValidateAccess(String fileId, String userId) {
        // 1. Lấy File (Chưa check quyền)
        FileNode node = fileNodeRepository.findByIdAndIsDeletedFalse(fileId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        // 2. Sử dụng logic Check Quyền tập trung (Đã bao gồm check Ancestor/Power Map)
        if (!permissionService.hasReadAccess(node, userId)) {
            // Tùy chọn: Ném ra 404 (Not Found) để giấu file, hoặc 403 (Access Denied)
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        return node;
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
