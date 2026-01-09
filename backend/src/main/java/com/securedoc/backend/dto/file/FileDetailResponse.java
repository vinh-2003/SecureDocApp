package com.securedoc.backend.dto.file;

import com.securedoc.backend.dto.response.UserPermissions;
import com.securedoc.backend.enums.EFileType;
import com.securedoc.backend.enums.EPublicAccess;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class FileDetailResponse {
    private String id;
    private String name;
    private String description;
    private EFileType type;
    private Long size;           // Kích thước (byte)
    private String mimeType;     // Loại file
    private String extension;    // Đuôi file

    // --- THÔNG TIN VỊ TRÍ ---
    private String locationPath; // VD: "Thư mục gốc / Dự án 2024 / Tài liệu"

    // --- THÔNG TIN THỜI GIAN ---
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // --- THÔNG TIN NGƯỜI DÙNG ---
    private UserSummary owner;         // Người tạo/Sở hữu
    private UserSummary lastModifiedBy;// Người sửa cuối cùng

    // --- THÔNG TIN QUYỀN HẠN ---
    private EPublicAccess publicAccess;
    private List<PermissionDetail> sharedWith; // Danh sách người được chia sẻ

    private UserPermissions permissions;

    // Inner DTO rút gọn cho User (tránh lộ password/role)
    @Data
    @Builder
    public static class UserSummary {
        private String id;
        private String name;
        private String email;
        private String avatarUrl;
    }

    // Inner DTO cho quyền hạn
    @Data
    @Builder
    public static class PermissionDetail {
        private UserSummary user;
        private String permissionType; // VIEW, EDIT
    }
}