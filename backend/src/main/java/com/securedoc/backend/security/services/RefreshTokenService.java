package com.securedoc.backend.security.services;

import com.securedoc.backend.entity.RefreshToken;
import com.securedoc.backend.entity.User;
import com.securedoc.backend.exception.TokenRefreshException;
import com.securedoc.backend.repository.RefreshTokenRepository;
import com.securedoc.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional; // MongoDB đơn lẻ không cần cái này trừ khi cấu hình Replica Set

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {
    @Value("${app.jwt.refresh-expiration-ms}")
    private Long refreshTokenDurationMs;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    public RefreshToken createRefreshToken(String userId) {
        // Xóa các token cũ của user này (nếu muốn mỗi user chỉ có 1 session)
        // refreshTokenRepository.deleteByUserId(userId);

        RefreshToken refreshToken = new RefreshToken();

        // Đoạn này tìm user chỉ để đảm bảo user tồn tại
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        refreshToken.setUserId(user.getId());
        refreshToken.setExpiryDate(LocalDateTime.ofInstant(
                Instant.now().plusMillis(refreshTokenDurationMs), ZoneId.systemDefault()));
        refreshToken.setToken(UUID.randomUUID().toString());

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new TokenRefreshException(token.getToken(), "Refresh token was expired. Please make a new signin request");
        }
        return token;
    }

    // --- SỬA ĐOẠN NÀY ---
    // Không cần @Transactional nếu MongoDB chạy Single Node (Dev env)
    // Đổi int -> void
    public void deleteByUserId(String userId) {
        // Không cần tìm User làm gì cho tốn tài nguyên
        // Gọi thẳng xuống Repository xóa theo ID
        refreshTokenRepository.deleteByUserId(userId);
    }
}