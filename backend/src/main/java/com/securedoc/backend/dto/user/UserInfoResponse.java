package com.securedoc.backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoResponse {
    private String id;
    private String username;
    private String email;
    private String fullName;  // Thêm trường này để hiển thị tên đầy đủ trên Header
    private String avatarUrl;
    private List<String> roles; // Danh sách quyền (ROLE_USER, ROLE_ADMIN...)
}