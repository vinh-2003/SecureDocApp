package com.securedoc.backend.dto.file; // Hoặc com.securedoc.backend.dto.folder

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FolderRenameRequest {

    @NotBlank(message = "Tên thư mục không được để trống")
    @Size(min = 1, max = 255, message = "Tên thư mục phải từ 1 đến 255 ký tự")
    // Regex chặn các ký tự cấm trong hệ thống file (Windows/Linux): \ / : * ? " < > |
    @Pattern(regexp = "^[^\\\\/:*?\"<>|]+$", message = "Tên thư mục không được chứa các ký tự đặc biệt: \\ / : * ? \" < > |")
    private String newName;
}