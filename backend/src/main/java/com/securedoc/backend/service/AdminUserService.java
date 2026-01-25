package com.securedoc.backend.service;

import com.securedoc.backend.dto.admin.AdminUserResponse;
import com.securedoc.backend.dto.admin.UpdateUserRoleRequest;
import com.securedoc.backend.entity.Role;
import com.securedoc.backend.entity.User;
import com.securedoc.backend.enums.ERole;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.repository.RoleRepository;
import com.securedoc.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    // 1. LẤY DANH SÁCH USER (CÓ PHÂN TRANG & SEARCH)
    public Page<AdminUserResponse> getUsers(int page, int size, String keyword, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<User> userPage;

        if (keyword != null && !keyword.isBlank()) {
            userPage = userRepository.searchUsers(keyword, pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        return userPage.map(this::convertToDto);
    }

    // 2. KHÓA / MỞ KHÓA TÀI KHOẢN
    public void updateUserLockStatus(String userId, boolean shouldLock, String currentAdminId) {
        if (userId.equals(currentAdminId)) {
            throw new AppException(AppErrorCode.SELF_LOCK_FORBIDDEN);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        user.setAccountNonLocked(!shouldLock);

        if (shouldLock) {
            // Khi Admin chủ động khóa:
            // Set lockTime = null để phân biệt với khóa do sai pass (có lockTime)
            // Logic bên AuthService sẽ hiểu: !isAccountNonLocked && lockTime == null => Admin Ban vĩnh viễn
            user.setLockTime(null);
            user.setFailedLoginAttempts(0); // Reset số lần sai
        } else {
            // Khi mở khóa
            user.setLockTime(null);
            user.setFailedLoginAttempts(0);
        }

        userRepository.save(user);
    }

    // 3. CẬP NHẬT QUYỀN (ROLE)
    public void updateUserRoles(String userId, UpdateUserRoleRequest request, String currentAdminId) {
        if (userId.equals(currentAdminId)) {
            throw new AppException(AppErrorCode.CANNOT_CHANGE_SELF_PERMISSION);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        Set<Role> newRoles = new HashSet<>();

        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            // Mặc định ít nhất phải là USER
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new AppException(AppErrorCode.ROLE_NOT_FOUND));
            newRoles.add(userRole);
        } else {
            request.getRoles().forEach(roleStr -> {
                try {
                    ERole eRole = ERole.valueOf(roleStr);
                    Role role = roleRepository.findByName(eRole)
                            .orElseThrow(() -> new AppException(AppErrorCode.ROLE_NOT_FOUND));
                    newRoles.add(role);
                } catch (IllegalArgumentException e) {
                    throw new AppException(AppErrorCode.INVALID_ROLE);
                }
            });
        }

        user.setRoles(newRoles);
        userRepository.save(user);
    }

    // HELPER: Convert Entity -> DTO
    private AdminUserResponse convertToDto(User user) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());

        return AdminUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .roles(roles)
                .isEnabled(user.isEnabled())
                .isAccountNonLocked(user.isAccountNonLocked())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}