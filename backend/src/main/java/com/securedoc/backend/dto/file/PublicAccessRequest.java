package com.securedoc.backend.dto.file;

import com.securedoc.backend.enums.EPublicAccess;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PublicAccessRequest {
    @NotNull(message = "Cấp độ public không được để trống")
    private EPublicAccess accessLevel;
}