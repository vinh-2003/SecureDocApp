package com.securedoc.backend.entity;

import com.securedoc.backend.enums.EFileStatus;
import com.securedoc.backend.enums.EFileType;
import com.securedoc.backend.enums.EPermissionRole;
import com.securedoc.backend.enums.EPublicAccess;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "file_nodes")
public class FileNode {
    @Id
    private String id;

    private String name;
    private String description;

    private EFileType type; // FILE hoặc FOLDER

    // --- Cấu trúc cây (Tree) ---
    private String parentId;

    @Builder.Default
    private List<String> ancestors = new ArrayList<>(); // Breadcrumb

    // --- Thông tin File ---
    private Long size;
    private String mimeType;
    private String extension;
    private String gridFsId; // Link tới GridFS (nội dung mã hóa)

    // --- Trạng thái & Phân loại ---
    @Builder.Default
    private EFileStatus status = EFileStatus.PENDING;
    private String errorMessage; // Nếu status = FAILED

    // --- Bảo mật Mã hóa ---
    private boolean isEncrypted;
    private EncryptionMetadata encryptionMetadata;

    // --- Phân quyền (ACL) ---
    private String ownerId; // Người sở hữu về mặt nghiệp vụ
    @Builder.Default
    private EPublicAccess publicAccess = EPublicAccess.PRIVATE;

    @Builder.Default
    private List<FilePermission> permissions = new ArrayList<>();

    // --- Vòng đời & Audit (CẬP NHẬT MỚI) ---
    private boolean isDeleted; // Soft delete

    @CreatedDate
    private LocalDateTime createdAt; // Ngày tạo (Tự động)

    @CreatedBy
    private String createdBy; // ID người tạo (Tự động lấy từ JWT)

    @LastModifiedDate
    private LocalDateTime updatedAt; // Ngày sửa cuối (Tự động)

    @LastModifiedBy
    private String lastModifiedBy; // ID người sửa cuối (Tự động lấy từ JWT)

    // ================= INNER CLASSES =================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EncryptionMetadata {
        private String algorithm; // "AES/GCM/NoPadding"
        private String iv;        // Base64 Initialization Vector
        private String keyId;     // Link tới FileKey collection
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FilePermission {
        private String userId;
        private EPermissionRole role; // VIEWER, EDITOR
    }
}