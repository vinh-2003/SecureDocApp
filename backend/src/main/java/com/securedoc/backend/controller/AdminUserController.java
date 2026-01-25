package com.securedoc.backend.controller;

import com.securedoc.backend.dto.admin.AdminUserResponse;
import com.securedoc.backend.dto.admin.UpdateUserRoleRequest;
import com.securedoc.backend.dto.admin.UpdateUserStatusRequest;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.payload.response.ApiResponse;
import com.securedoc.backend.security.services.UserDetailsImpl;
import com.securedoc.backend.service.AdminUserService;
import com.securedoc.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Chỉ cho phép ADMIN truy cập toàn bộ controller này
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final AuthService authService;

    // 1. Get List Users (Pagination & Search)
    // URL: /api/admin/users?page=0&size=10&keyword=abc&sortBy=createdAt&direction=desc
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Page<AdminUserResponse> users = adminUserService.getUsers(page, size, keyword, sortBy, direction);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    // 2. Lock / Unlock User
    @PatchMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<String>> updateUserStatus(
            @PathVariable String userId,
            @RequestBody UpdateUserStatusRequest request
    ) {
        String adminId = getCurrentUserId();
        adminUserService.updateUserLockStatus(userId, request.getIsLocked(), adminId);

        String msg = request.getIsLocked() ? "Đã khóa tài khoản thành công" : "Đã mở khóa tài khoản thành công";
        return ResponseEntity.ok(ApiResponse.success(msg));
    }

    // 3. Update Roles
    @PutMapping("/{userId}/roles")
    public ResponseEntity<ApiResponse<String>> updateUserRoles(
            @PathVariable String userId,
            @RequestBody UpdateUserRoleRequest request
    ) {
        String adminId = getCurrentUserId();
        adminUserService.updateUserRoles(userId, request, adminId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật quyền thành công"));
    }

    // Helper để lấy ID admin đang thao tác
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        throw new AppException(AppErrorCode.USER_NOT_FOUND);
    }
}