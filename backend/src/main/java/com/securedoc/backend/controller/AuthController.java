package com.securedoc.backend.controller;

import com.securedoc.backend.dto.auth.*;
import com.securedoc.backend.entity.RefreshToken;
import com.securedoc.backend.entity.User;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.payload.response.ApiResponse;
import com.securedoc.backend.repository.UserRepository;
import com.securedoc.backend.security.jwt.JwtUtils;
import com.securedoc.backend.security.services.RefreshTokenService;
import com.securedoc.backend.security.services.UserDetailsImpl;
import com.securedoc.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600) // Cho phép gọi từ mọi nguồn (Dev mode)
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    // --- 1. ĐĂNG NHẬP ---
    @PostMapping("/signin")
    public ResponseEntity<ApiResponse<TokenResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        // Logic xác thực nằm hết trong AuthService
        TokenResponse tokenResponse = authService.authenticateUser(loginRequest);

        return ResponseEntity.ok(ApiResponse.success(tokenResponse, "Đăng nhập thành công"));
    }

    // --- 2. ĐĂNG KÝ ---
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<String>> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        authService.registerUser(signUpRequest);

        return ResponseEntity.ok(ApiResponse.success("Đăng ký tài khoản thành công!"));
    }

    // --- 3. LÀM MỚI TOKEN (REFRESH TOKEN) ---
    @PostMapping("/refreshtoken")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshtoken(@Valid @RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration) // Kiểm tra hết hạn
                .map(RefreshToken::getUserId) // Lấy userId từ token
                .map(userId -> {
                    // Tìm user trong DB để lấy username chuẩn
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

                    // Tạo Access Token mới
                    String newAccessToken = jwtUtils.generateTokenFromUsername(user.getUsername());

                    return ResponseEntity.ok(ApiResponse.success(
                            new TokenRefreshResponse(newAccessToken, requestRefreshToken),
                            "Làm mới token thành công"
                    ));
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    // --- 4. ĐĂNG XUẤT ---
    @PostMapping("/signout")
    public ResponseEntity<ApiResponse<String>> logoutUser() {
        // Lấy thông tin user hiện tại từ SecurityContext
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            String userId = userDetails.getId();

            // Xóa Refresh Token trong DB
            refreshTokenService.deleteByUserId(userId);

            return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công!"));
        }

        return ResponseEntity.ok(ApiResponse.success("Không tìm thấy phiên đăng nhập để đăng xuất"));
    }
}