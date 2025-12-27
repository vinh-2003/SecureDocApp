package com.securedoc.backend.dto.file;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FileRenameRequest {

    @NotBlank(message = "Tên tệp tin không được để trống")
    @Size(min = 1, max = 255, message = "Tên tệp tin phải từ 1 đến 255 ký tự")
    // Regex chặn các ký tự cấm
    @Pattern(regexp = "^[^\\\\/:*?\"<>|]+$", message = "Tên tệp tin không được chứa các ký tự đặc biệt: \\ / : * ? \" < > |")
    private String newName;
}