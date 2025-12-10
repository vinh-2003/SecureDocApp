package com.securedoc.backend.dto.file;

import com.securedoc.backend.enums.EPermissionRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ShareFileRequest {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotNull(message = "Vui lòng chọn quyền hạn")
    private EPermissionRole role; // VIEWER hoặc EDITOR
}