package com.securedoc.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {

    private String accessToken;

    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer"; // Loại token chuẩn quốc tế

    private String userId;

    private String username;

    private String email;

    private String fullName;

    private String avatarUrl;

    // (Optional) Danh sách quyền để Frontend ẩn/hiện menu
    private java.util.List<String> roles;
}