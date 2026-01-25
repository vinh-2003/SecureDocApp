package com.securedoc.backend.dto.admin;

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
public class AdminUserResponse {
    private String id;
    private String username;
    private String email;
    private String fullName;
    private String avatarUrl;
    private List<String> roles;

    // Trạng thái tài khoản
    private boolean isEnabled;
    private boolean isAccountNonLocked;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLogin; // Nếu bạn có tracking
}