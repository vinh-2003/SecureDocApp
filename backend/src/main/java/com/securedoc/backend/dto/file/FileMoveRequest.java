package com.securedoc.backend.dto.file;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class FileMoveRequest {
    @NotEmpty(message = "Danh sách ID file/folder không được để trống")
    private List<String> itemIds;
    private String targetParentId; // ID thư mục đích (null nếu chuyển ra Root)
}