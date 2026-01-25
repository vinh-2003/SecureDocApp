package com.securedoc.backend.service;

import com.securedoc.backend.dto.user.ChangePasswordRequest;
import com.securedoc.backend.dto.user.UpdateProfileRequest;
import com.securedoc.backend.dto.user.UserInfoResponse; // Đảm bảo đã có DTO này
import com.securedoc.backend.dto.user.UserProfileResponse;
import com.securedoc.backend.entity.User;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    public UserInfoResponse findUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        // Convert Role Entity sang List String (ví dụ: ["ROLE_USER"])
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .toList();

        return new UserInfoResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(), // Nếu User entity chưa có fullName thì trả về username hoặc null
                user.getAvatarUrl(),
                roles
        );
    }

    public UserInfoResponse getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());

        return new UserInfoResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                roles
        );
    }

    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        // 1. Kiểm tra mật khẩu cũ có đúng không
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(AppErrorCode.INVALID_PASSWORD); // Hoặc ném lỗi "Mật khẩu hiện tại không đúng"
        }

        // 2. Kiểm tra mật khẩu mới có trùng mật khẩu cũ không (Tuỳ chọn)
        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new AppException(AppErrorCode.PASSWORD_DUPLICATE);
        }

        // 3. Mã hóa và lưu mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // --- SAVE AVATAR FILE ---
    // 1. LẤY THÔNG TIN PROFILE
    public UserProfileResponse getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());

        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                roles,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    // 2. CẬP NHẬT PROFILE
    public UserProfileResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        // Cập nhật FullName
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }

        // Cập nhật Avatar
        if (request.getAvatar() != null && !request.getAvatar().isEmpty()) {
            try {
                // --- BƯỚC MỚI: XÓA ẢNH CŨ ---
                String oldAvatarUrl = user.getAvatarUrl();

                // Chỉ xóa nếu URL đó là URL nội bộ của hệ thống (chứa /api/files/view/)
                // Tránh xóa nhầm nếu user dùng ảnh Google/Facebook login
                if (oldAvatarUrl != null && oldAvatarUrl.contains("/api/files/view/")) {
                    String fileId = extractIdFromUrl(oldAvatarUrl);
                    fileStorageService.deleteFile(fileId);
                }
                // -----------------------------

                // Lưu ảnh mới
                String avatarUrl = fileStorageService.storeFile(request.getAvatar());
                user.setAvatarUrl(avatarUrl);

            } catch (Exception e) {
                throw new AppException(AppErrorCode.AVATAR_UPLOAD_FAILURE);
            }
        }

        User updatedUser = userRepository.save(user);

        // Map sang DTO trả về
        List<String> roles = updatedUser.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());

        return new UserProfileResponse(
                updatedUser.getId(),
                updatedUser.getUsername(),
                updatedUser.getEmail(),
                updatedUser.getFullName(),
                updatedUser.getAvatarUrl(),
                roles,
                updatedUser.getCreatedAt(),
                updatedUser.getUpdatedAt()
        );
    }

    /**
     * Helper: Trích xuất ID từ URL
     * URL: http://localhost:8080/api/files/view/65abc123...
     * Result: 65abc123...
     */
    private String extractIdFromUrl(String url) {
        try {
            return url.substring(url.lastIndexOf("/") + 1);
        } catch (Exception e) {
            return null;
        }
    }
}