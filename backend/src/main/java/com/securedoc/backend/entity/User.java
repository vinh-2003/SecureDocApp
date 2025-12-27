package com.securedoc.backend.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    @Indexed(unique = true)
    private String email;

    private String password; // Hash BCrypt

    private String fullName;
    private String avatarUrl;

    // Tham chiếu sang Collection "roles"
    @DBRef
    private Set<Role> roles;

    // --- SPRING SECURITY FLAGS (Quan trọng) ---
    @Builder.Default
    private boolean isEnabled = true; // Kích hoạt

    @Builder.Default
    private boolean isAccountNonLocked = true; // Không bị khóa

    @Builder.Default
    private boolean isAccountNonExpired = true; // Tài khoản còn hạn

    @Builder.Default
    private boolean isCredentialsNonExpired = true; // Mật khẩu còn hạn

    // --- LOGIN ATTEMPT TRACKING ---
    @Builder.Default
    private int failedLoginAttempts = 0; // Đếm số lần sai

    private LocalDateTime lockTime; // Thời điểm bị khóa

    // --- Audit ---
    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}