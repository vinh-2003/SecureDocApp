package com.securedoc.backend.dto.file;

import com.securedoc.backend.enums.EFileStatus;
import com.securedoc.backend.enums.EFileType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileResponse {

    private String id;
    private String name;
    private String description;

    private EFileType type; // FILE hoặc FOLDER

    // --- Thông tin cây thư mục ---
    private String parentId;
    private List<String> ancestors; // Breadcrumb

    // --- Thông tin File ---
    private Long size;
    private String mimeType;
    private String extension;

    // --- Trạng thái ---
    private EFileStatus status;
    private String errorMessage; // Chỉ hiện nếu status = FAILED

    // --- Thông tin bổ sung ---
    private boolean isPublic;
    private String ownerId;

    // --- Audit Info (Thông tin người tạo/sửa) ---
    private String createdBy;       // ID người tạo
    private LocalDateTime createdAt;

    private String lastModifiedBy;  // ID người sửa cuối
    private LocalDateTime updatedAt;
}