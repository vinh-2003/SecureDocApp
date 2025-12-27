package com.securedoc.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {
    @NotBlank(message = "Google Token không được để trống")
    private String idToken; // Token mà frontend nhận được từ Google
}