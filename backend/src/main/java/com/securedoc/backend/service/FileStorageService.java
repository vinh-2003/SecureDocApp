package com.securedoc.backend.service;

import com.mongodb.client.gridfs.model.GridFSFile;
import com.securedoc.backend.dto.file.FileDownloadResponse;
import com.securedoc.backend.dto.file.FileMetadataRequest;
import com.securedoc.backend.dto.file.FileResponse;
import com.securedoc.backend.dto.file.FolderCreateRequest;
import com.securedoc.backend.entity.FileKey;
import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.entity.elasticsearch.DocumentIndex;
import com.securedoc.backend.enums.EFileStatus;
import com.securedoc.backend.enums.EFileType;
import com.securedoc.backend.enums.EPublicAccess;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.repository.FileKeyRepository;
import com.securedoc.backend.repository.FileNodeRepository;
import com.securedoc.backend.repository.elasticsearch.DocumentIndexRepository;
import com.securedoc.backend.utils.CryptoUtils;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.modelmapper.ModelMapper;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.SecretKey;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final FileNodeRepository fileNodeRepository;
    private final DocumentIndexRepository documentIndexRepository;
    private final FileKeyRepository fileKeyRepository;
    private final RecentFileService recentFileService;
    private final FileShareService fileShareService;

    private final ModelMapper modelMapper;
    private final GridFsTemplate gridFsTemplate;
    private final CryptoUtils cryptoUtils;
    private final Tika tika;

    /**
     * TẠO THƯ MỤC MỚI
     */
    @Transactional
    public FileResponse createFolder(FolderCreateRequest request, String userId) {

        // Check trùng tên
        if (fileNodeRepository.existsByParentIdAndNameAndIsDeletedFalse(request.getParentId(), request.getName())) {
            throw new AppException(AppErrorCode.FILE_NAME_EXISTED);
        }

        List<String> ancestors = new ArrayList<>();
        EPublicAccess inheritedPublic = EPublicAccess.PRIVATE;
        List<FileNode.FilePermission> inheritedPerms = new ArrayList<>();

        // --- KIỂM TRA QUYỀN TRÊN FOLDER CHA ---
        if (request.getParentId() != null) {
            FileNode parent = fileNodeRepository.findByIdAndIsDeletedFalse(request.getParentId())
                    .orElseThrow(() -> new AppException(AppErrorCode.PARENT_NOT_FOUND));

            if (parent.getType() != EFileType.FOLDER) {
                throw new AppException(AppErrorCode.PARENT_IS_NOT_FOLDER);
            }

            // [SECURITY CHECK] Người dùng có quyền SỬA trên folder cha không?
            // Hàm hasEditAccess đã bao gồm check: Owner, Editor permission, hoặc Public Edit
            if (!fileShareService.hasEditAccess(parent, userId)) {
                throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
            }

            // Logic thừa kế
            ancestors.addAll(parent.getAncestors());
            ancestors.add(parent.getId());
            inheritedPublic = parent.getPublicAccess();
            if (parent.getPermissions() != null) {
                inheritedPerms.addAll(parent.getPermissions());
            }
        }

        FileNode folder = FileNode.builder()
                .name(request.getName())
                .type(EFileType.FOLDER)
                .parentId(request.getParentId())
                .ancestors(ancestors)
                .ownerId(userId) // Người tạo là chủ sở hữu folder con
                .status(EFileStatus.AVAILABLE)
                .isEncrypted(false)
                .isDeleted(false)
                .publicAccess(inheritedPublic)
                .permissions(inheritedPerms)
                .build();

        FileNode savedFolder = fileNodeRepository.save(folder);
        saveToElasticsearch(savedFolder);

        return modelMapper.map(savedFolder, FileResponse.class);
    }

    /**
     * UPLOAD FILE
     */
    @Transactional
    public FileResponse uploadFile(MultipartFile file, FileMetadataRequest metadata, String userId) throws Exception {
        String fileName = file.getOriginalFilename();

        if (fileNodeRepository.existsByParentIdAndNameAndIsDeletedFalse(metadata.getParentId(), fileName)) {
            throw new AppException(AppErrorCode.FILE_NAME_EXISTED);
        }

        List<String> ancestors = new ArrayList<>();
        EPublicAccess inheritedPublic = EPublicAccess.PRIVATE;
        List<FileNode.FilePermission> inheritedPerms = new ArrayList<>();

        // --- KIỂM TRA QUYỀN TRÊN FOLDER CHA ---
        if (metadata.getParentId() != null) {
            FileNode parent = fileNodeRepository.findByIdAndIsDeletedFalse(metadata.getParentId())
                    .orElseThrow(() -> new AppException(AppErrorCode.PARENT_NOT_FOUND));

            if (parent.getType() != EFileType.FOLDER) throw new AppException(AppErrorCode.PARENT_IS_NOT_FOLDER);

            // [SECURITY CHECK] Kiểm tra quyền Ghi/Sửa
            if (!fileShareService.hasEditAccess(parent, userId)) {
                throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
            }

            // Logic thừa kế
            ancestors.addAll(parent.getAncestors());
            ancestors.add(parent.getId());
            inheritedPublic = parent.getPublicAccess();
            if (parent.getPermissions() != null) {
                inheritedPerms.addAll(parent.getPermissions());
            }
        }

        // --- XỬ LÝ TIKA & ENCRYPTION (Giữ nguyên như cũ) ---

        String realMimeType;
        try (InputStream stream = file.getInputStream()) {
            realMimeType = tika.detect(stream);
        }

        // Log warning nếu sai mime type
        String clientMimeType = file.getContentType();
        if (!realMimeType.equals(clientMimeType)) {
            // System.out.println("Warning mime type...");
        }

        String extractedContent = "";
        try (InputStream stream = file.getInputStream()) {
            extractedContent = tika.parseToString(stream);
        } catch (Exception e) {
            System.err.println("Tika extract error: " + e.getMessage());
        }

        SecretKey fileKey = cryptoUtils.generateSecretKey();
        byte[] iv = cryptoUtils.generateIV();
        Cipher encryptCipher = cryptoUtils.getEncryptCipher(fileKey, iv);

        InputStream fileStream = file.getInputStream();
        CipherInputStream encryptedStream = new CipherInputStream(fileStream, encryptCipher);
        Object gridFsId = gridFsTemplate.store(encryptedStream, fileName, realMimeType);

        FileNode fileNode = FileNode.builder()
                .name(fileName)
                .description(metadata.getDescription())
                .type(EFileType.FILE)
                .parentId(metadata.getParentId())
                .ancestors(ancestors)
                .size(file.getSize())
                .mimeType(realMimeType)
                .extension(getExt(fileName))
                .gridFsId(gridFsId.toString())
                .ownerId(userId)
                .status(EFileStatus.AVAILABLE)
                .isEncrypted(true)
                .isDeleted(false)
                .publicAccess(inheritedPublic) // Thừa kế quyền public
                .permissions(inheritedPerms)   // Thừa kế danh sách share
                .encryptionMetadata(new FileNode.EncryptionMetadata(
                        "AES/GCM/NoPadding",
                        cryptoUtils.encodeBase64(iv),
                        null
                ))
                .build();

        FileNode savedNode = fileNodeRepository.save(fileNode);

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

    // --- HELPER FUNCTIONS ---

    private void saveToElasticsearch(FileNode node) {
        saveToElasticsearch(node, null);
    }

    private void saveToElasticsearch(FileNode node, String content) {
        List<String> allowed = new ArrayList<>();
        allowed.add(node.getOwnerId());

//        if (node.getPublicAccess() != EPublicAccess.PRIVATE) {
//            allowed.add("PUBLIC");
//        }

        if (node.getPermissions() != null) {
            node.getPermissions().forEach(p -> allowed.add(p.getUserId()));
        }

        DocumentIndex docIndex = DocumentIndex.builder()
                .id(node.getId())
                .title(node.getName())
                .description(node.getDescription())
                .content(content)
                .type(node.getType().name())
                .extension(node.getExtension())
                .status(node.getStatus().name())
                .ownerId(node.getOwnerId())
                .allowedUsers(allowed)
                .createdAt(node.getCreatedAt() != null ? node.getCreatedAt().toString() : null)
                .build();

        documentIndexRepository.save(docIndex);
    }

    private String getExt(String fileName) {
        return fileName != null && fileName.contains(".")
                ? fileName.substring(fileName.lastIndexOf(".") + 1) : "";
    }
}