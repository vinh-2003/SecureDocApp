package com.securedoc.backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private String id;
    private String username;
    private String email;
    private String fullName;
    private String avatarUrl;
    private List<String> roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}