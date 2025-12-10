package com.securedoc.backend.dto.file;

import lombok.Data;

@Data
public class FileMetadataRequest {
    private String parentId;    // ID thư mục cha
    private String description; // Mô tả file
    // Có thể thêm List<String> tagIds sau này
}