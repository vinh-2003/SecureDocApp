package com.securedoc.backend.controller;

import com.securedoc.backend.dto.user.ChangePasswordRequest;
import com.securedoc.backend.dto.user.UpdateProfileRequest;
import com.securedoc.backend.dto.user.UserInfoResponse;
import com.securedoc.backend.dto.user.UserProfileResponse;
import com.securedoc.backend.payload.response.ApiResponse;
import com.securedoc.backend.security.services.UserDetailsImpl;
import com.securedoc.backend.service.UserService; // Gọi Service, KHÔNG gọi Repo
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService; // Inject Service

    @GetMapping("/find-by-email")
    public ResponseEntity<ApiResponse<UserInfoResponse>> getUserByEmail(@RequestParam String email) {

        // Gọi Service để lấy dữ liệu đã xử lý
        UserInfoResponse userInfo = userService.findUserByEmail(email);

        return ResponseEntity.ok(ApiResponse.success(userInfo));
    }

    /**
     * Lấy thông tin User theo ID
     * Dùng cho việc hiển thị tên Owner trong bộ lọc khi F5 trang
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserInfoResponse>> getUserById(@PathVariable String id) {
        UserInfoResponse userInfo = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(userInfo));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        // Lấy ID user đang đăng nhập
        String userId = getCurrentUserId(); // Hàm utility lấy ID từ SecurityContext

        userService.changePassword(userId, request);

        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công"));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile() {
        String userId = getCurrentUserId();
        UserProfileResponse profile = userService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @ModelAttribute UpdateProfileRequest request // Dùng ModelAttribute để map form-data
    ) {
        String userId = getCurrentUserId();
        UserProfileResponse updatedProfile = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success(updatedProfile));
    }

    // HELPER FUNCTIONS
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        throw new RuntimeException("Unauthorized: Không tìm thấy thông tin người dùng");
    }
}