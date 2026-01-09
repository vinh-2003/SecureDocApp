package com.securedoc.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.securedoc.backend.dto.auth.*;
import com.securedoc.backend.entity.RefreshToken;
import com.securedoc.backend.entity.Role;
import com.securedoc.backend.entity.User;
import com.securedoc.backend.entity.VerificationToken;
import com.securedoc.backend.enums.ERole;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.repository.RoleRepository;
import com.securedoc.backend.repository.UserRepository;
import com.securedoc.backend.repository.VerificationTokenRepository;
import com.securedoc.backend.security.jwt.JwtUtils;
import com.securedoc.backend.security.services.RefreshTokenService;
import com.securedoc.backend.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final RefreshTokenService refreshTokenService;
    private final VerificationTokenRepository tokenRepository;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl; // Sẽ lấy giá trị: http://localhost:3000 (hoặc domain thật)

    @Value("${app.security.max-failed-attempts}")
    private int maxFailedAttempts; // 5

    @Value("${app.security.lock-time-duration-minutes}")
    private long lockTimeDuration; // 30

    @Value("${app.security.token-expiration-minutes}")
    private long tokenExpirationMinutes; // 15

    @Value("${app.google.client-id}")
    private String googleClientId;

    // --- 1. ĐĂNG NHẬP ---
    public TokenResponse authenticateUser(LoginRequest loginRequest) {
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        // Kiểm tra khóa
        if (!user.isAccountNonLocked()) {
            if (user.getLockTime() != null &&
                    user.getLockTime().plusMinutes(lockTimeDuration).isBefore(LocalDateTime.now())) {
                // Hết hạn khóa -> Mở lại
                user.setAccountNonLocked(true);
                user.setLockTime(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            } else {
                throw new AppException(AppErrorCode.ACCOUNT_LOCKED);
            }
        }

        // Kiểm tra kích hoạt
        if (!user.isEnabled()) {
            throw new AppException(AppErrorCode.ACCOUNT_NOT_ENABLED);
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            // Login thành công -> Reset bộ đếm lỗi
            if (user.getFailedLoginAttempts() > 0) {
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }

            String jwt = jwtUtils.generateJwtToken(authentication);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority).collect(Collectors.toList());

            return TokenResponse.builder()
                    .accessToken(jwt)
                    .refreshToken(refreshToken.getToken())
                    .userId(userDetails.getId())
                    .username(userDetails.getUsername())
                    .email(userDetails.getEmail())
                    .fullName(user.getFullName())
                    .avatarUrl(user.getAvatarUrl())
                    .roles(roles)
                    .build();

        } catch (Exception e) {
            // Login thất bại -> Tăng số lần sai
            increaseFailedAttempts(user);
            throw e;
        }
    }

    private void increaseFailedAttempts(User user) {
        int newFailAttempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(newFailAttempts);

        // So sánh với biến cấu hình maxFailedAttempts
        if (newFailAttempts >= maxFailedAttempts) {
            user.setAccountNonLocked(false);
            user.setLockTime(LocalDateTime.now());
        }
        userRepository.save(user);
    }

    // --- 2. ĐĂNG KÝ ---
    public void registerUser(RegisterRequest signUpRequest) {
        // Validate trùng lặp
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            throw new AppException(AppErrorCode.USER_EXISTED);
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new AppException(AppErrorCode.EMAIL_EXISTED);
        }

        // Tạo User mới
        User user = User.builder()
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .password(passwordEncoder.encode(signUpRequest.getPassword()))
                .fullName(signUpRequest.getFullName())
                .isEnabled(false) // Mặc định chưa kích hoạt
                .isAccountNonLocked(true)
                .build();

        // Gán Role mặc định là USER
        Set<Role> roles = new HashSet<>();

        // Tìm Role trong DB, nếu không có thì báo lỗi (Lỗi hệ thống nghiêm trọng nếu thiếu Role)
        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                .orElseThrow(() -> new AppException(AppErrorCode.ROLE_NOT_FOUND));

        roles.add(userRole);
        user.setRoles(roles);

        userRepository.save(user);

        // --- GỬI EMAIL XÁC THỰC ---
        VerificationToken token = new VerificationToken(user, VerificationToken.TokenType.VERIFY_EMAIL, tokenExpirationMinutes);
        tokenRepository.save(token);

        // Tạo Link động dựa trên frontendUrl
        String link = frontendUrl + "/verify-account?token=" + token.getToken();

        emailService.sendEmail(user.getEmail(), "Xác thực tài khoản SecureDoc",
                "<h3>Chào mừng đến với SecureDoc!</h3>" +
                        "<p>Click vào link dưới đây để kích hoạt tài khoản của bạn:</p>" +
                        "<a href=\"" + link + "\">Kích hoạt ngay</a>" +
                        "<p>Link này sẽ hết hạn sau " + tokenExpirationMinutes + " phút.</p>");
    }

    // XÁC THỰC TÀI KHOẢN ---
    public void verifyAccount(String tokenStr) {
        VerificationToken token = tokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new AppException(AppErrorCode.INVALID_TOKEN));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new AppException(AppErrorCode.TOKEN_EXPIRED);
        }

        User user = token.getUser();
        user.setEnabled(true); // Kích hoạt
        userRepository.save(user);

        tokenRepository.delete(token); // Dùng xong xóa
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        tokenRepository.deleteByUser(user);

        // Tạo token reset pass
        VerificationToken token = new VerificationToken(user, VerificationToken.TokenType.RESET_PASSWORD, tokenExpirationMinutes);
        tokenRepository.save(token);

        // Tạo Link động
        String link = frontendUrl + "/reset-password?token=" + token.getToken();

        emailService.sendEmail(user.getEmail(), "Đặt lại mật khẩu SecureDoc",
                "<p>Click vào link để đặt lại mật khẩu:</p>" +
                        "<a href=\"" + link + "\">Đặt lại mật khẩu</a>");
    }

    public void resetPassword(ResetPasswordRequest request) {
        VerificationToken token = tokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new AppException(AppErrorCode.INVALID_TOKEN));

        if (token.getExpiryDate().isBefore(LocalDateTime.now()) || token.getType() != VerificationToken.TokenType.RESET_PASSWORD) {
            throw new AppException(AppErrorCode.TOKEN_EXPIRED);
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        // Mở khóa luôn nếu user đang bị khóa do nhập sai nhiều lần
        user.setAccountNonLocked(true);
        user.setFailedLoginAttempts(0);
        user.setLockTime(null);

        userRepository.save(user);
        tokenRepository.delete(token);
    }

    // --- LOGIC ĐĂNG NHẬP GOOGLE ---
    public TokenResponse authenticateGoogleUser(GoogleLoginRequest request) {
        try {
            // 1. Cấu hình Verifier để xác thực token với Google
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            // 2. Xác thực Token gửi từ Frontend
            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken == null) {
                throw new AppException(AppErrorCode.INVALID_TOKEN); // Token Google không hợp lệ
            }

            // 3. Lấy thông tin user từ Token Google
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            // 4. Kiểm tra xem email này đã có trong DB chưa
            User user;
            if (userRepository.existsByEmail(email)) {
                // Case A: Đã tồn tại -> Lấy user ra
                user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

                // (Option) Cập nhật lại avatar/tên nếu muốn đồng bộ mỗi lần login
                // user.setFullName(name);
                // user.setAvatarUrl(pictureUrl);
                // userRepository.save(user);
            } else {
                // Case B: Chưa tồn tại -> Đăng ký tự động (JIT Provisioning)
                user = createGoogleUser(email, name, pictureUrl);
            }

            // 5. Kiểm tra trạng thái khóa (giống login thường)
            if (!user.isAccountNonLocked() || !user.isEnabled()) {
                throw new AppException(AppErrorCode.ACCOUNT_LOCKED); // Hoặc ACCOUNT_NOT_ENABLED
            }

            // 6. Sinh JWT của hệ thống (Access Token & Refresh Token)
            // Lưu ý: User Google không có password để authenticateManager check,
            // nên ta phải tự build UserDetails và sinh token thủ công.

            UserDetailsImpl userDetails = UserDetailsImpl.build(user);

            // Tạo Authentication object giả lập (để JwtUtils dùng)
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = jwtUtils.generateJwtToken(authentication);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority).collect(Collectors.toList());

            return TokenResponse.builder()
                    .accessToken(jwt)
                    .refreshToken(refreshToken.getToken())
                    .userId(userDetails.getId())
                    .username(userDetails.getUsername())
                    .email(userDetails.getEmail())
                    .fullName(user.getFullName())
                    .avatarUrl(user.getAvatarUrl())
                    .roles(roles)
                    .build();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new AppException(AppErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    // Hàm phụ: Tạo User mới từ thông tin Google
    private User createGoogleUser(String email, String name, String avatarUrl) {
        // Tạo username từ phần trước @ của email (hoặc random nếu trùng)
        String baseUsername = email.split("@")[0];
        String username = baseUsername;
        int count = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + count++;
        }

        // Tạo password ngẫu nhiên (User Google không dùng pass này để login, nhưng DB cần not null)
        String randomPassword = UUID.randomUUID().toString();

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(randomPassword)) // Hash pass ngẫu nhiên
                .fullName(name)
                .avatarUrl(avatarUrl)
                .isEnabled(true) // Google đã verify email rồi nên kích hoạt luôn
                .isAccountNonLocked(true)
                .isAccountNonExpired(true)
                .isCredentialsNonExpired(true)
                .build();

        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                .orElseThrow(() -> new AppException(AppErrorCode.ROLE_NOT_FOUND));
        roles.add(userRole);
        user.setRoles(roles);

        return userRepository.save(user);
    }
}