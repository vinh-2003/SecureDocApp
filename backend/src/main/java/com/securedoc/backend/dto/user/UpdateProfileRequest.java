package com.securedoc.backend.dto.user;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private MultipartFile avatar; // File ảnh upload lên
}