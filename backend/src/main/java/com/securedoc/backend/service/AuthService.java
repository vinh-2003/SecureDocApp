package com.securedoc.backend.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.securedoc.backend.dto.auth.GoogleLoginRequest;
import com.securedoc.backend.dto.auth.LoginRequest;
import com.securedoc.backend.dto.auth.RegisterRequest;
import com.securedoc.backend.dto.auth.ResetPasswordRequest;
import com.securedoc.backend.dto.auth.TokenResponse;
import com.securedoc.backend.entity.RefreshToken;
import com.securedoc.backend.entity.Role;
import com.securedoc.backend.entity.User;
import com.securedoc.backend.entity.VerificationToken;
import com.securedoc.backend.enums.EAccessAction;
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
    private final AccessLogService accessLogService;
    private final ModelMapper modelMapper; // Inject ModelMapper

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.security.max-failed-attempts}")
    private int maxFailedAttempts;

    @Value("${app.security.lock-time-duration-minutes}")
    private long lockTimeDuration;

    @Value("${app.security.token-expiration-minutes}")
    private long tokenExpirationMinutes;

    @Value("${app.google.client-id}")
    private String googleClientId;

    // --- 1. ĐĂNG NHẬP ---
    public TokenResponse authenticateUser(LoginRequest loginRequest) {
        String username = loginRequest.getUsername();

        try {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

            // --- LOGIC KIỂM TRA KHÓA ---
            if (!user.isAccountNonLocked()) {
                // Trường hợp 1: Khóa tạm thời (do đăng nhập sai) -> Có lockTime
                if (user.getLockTime() != null) {
                    if (user.getLockTime().plusMinutes(lockTimeDuration).isBefore(LocalDateTime.now())) {
                        // Hết thời gian khóa -> Mở lại
                        unlockUser(user);
                    } else {
                        throw new AppException(AppErrorCode.ACCOUNT_LOCKED); // Vẫn còn trong thời gian khóa
                    }
                } else {
                    // Trường hợp 2: Khóa vĩnh viễn (do Admin khóa) -> lockTime == null
                    throw new AppException(AppErrorCode.ACCOUNT_LOCKED_BY_ADMIN); // Admin đã khóa, user không thể tự mở
                }
            }

            // Kiểm tra kích hoạt email
            if (!user.isEnabled()) {
                throw new AppException(AppErrorCode.ACCOUNT_NOT_ENABLED);
            }


                Authentication authentication = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

                // Login thành công -> Reset bộ đếm lỗi
                if (user.getFailedLoginAttempts() > 0) {
                    unlockUser(user);
                }

                String jwt = jwtUtils.generateJwtToken(authentication);
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());
                List<String> roles = userDetails.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority).collect(Collectors.toList());

                accessLogService.logAccess(
                        user.getId(),
                        user.getUsername(),
                        EAccessAction.LOGIN,
                        true,
                        null,
                        accessLogService.getClientIp(),
                        accessLogService.getUserAgent()
                );

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
            String failedUserId = userRepository.findByUsername(username)
                    .map(User::getId)
                    .orElse(null);

            accessLogService.logAccess(
                    failedUserId,
                    username,
                    EAccessAction.LOGIN,
                    false,
                    e.getMessage(),
                    accessLogService.getClientIp(),
                    accessLogService.getUserAgent()
            );

            // Login thất bại -> Tăng số lần sai (Chỉ áp dụng nếu user chưa bị khóa bởi admin)
            userRepository.findByUsername(username).ifPresent(user -> {
                if (user.isAccountNonLocked()) {
                    increaseFailedAttempts(user);
                }
            });
            throw e;
        }
    }

    private void unlockUser(User user) {
        user.setAccountNonLocked(true);
        user.setLockTime(null);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
    }

    private void increaseFailedAttempts(User user) {
        int newFailAttempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(newFailAttempts);

        if (newFailAttempts >= maxFailedAttempts) {
            user.setAccountNonLocked(false);
            user.setLockTime(LocalDateTime.now()); // Set thời gian để biết đây là khóa tạm thời
        }
        userRepository.save(user);
    }

    // --- 2. ĐĂNG KÝ (Dùng ModelMapper) ---
    public void registerUser(RegisterRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            throw new AppException(AppErrorCode.USER_EXISTED);
        }
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new AppException(AppErrorCode.EMAIL_EXISTED);
        }

        // Sử dụng ModelMapper để map dữ liệu cơ bản
        User user = modelMapper.map(signUpRequest, User.class);

        // Set các trường logic security
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));
        user.setEnabled(false);
        user.setAccountNonLocked(true);
        user.setAccountNonExpired(true);
        user.setCredentialsNonExpired(true);

        // Gán Role
        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                .orElseThrow(() -> new AppException(AppErrorCode.ROLE_NOT_FOUND));
        roles.add(userRole);
        user.setRoles(roles);

        userRepository.save(user);

        // Gửi email xác thực
        sendVerificationEmail(user);
    }

    // --- 3. GỬI LẠI EMAIL XÁC THỰC (Mới) ---
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        if (user.isEnabled()) {
            throw new AppException(AppErrorCode.VERIFIED_ACCOUNT);
        }

        // Xóa token cũ nếu có để tránh rác
        tokenRepository.deleteByUserAndType(user, VerificationToken.TokenType.VERIFY_EMAIL);

        // Gửi lại email
        sendVerificationEmail(user);
    }

    // Helper: Logic gửi email verify tách riêng để tái sử dụng
    private void sendVerificationEmail(User user) {
        VerificationToken token = new VerificationToken(user, VerificationToken.TokenType.VERIFY_EMAIL, tokenExpirationMinutes);
        tokenRepository.save(token);

        String link = frontendUrl + "/verify-email?token=" + token.getToken();

        emailService.sendEmail(user.getEmail(), "Xác thực tài khoản SecureDoc",
                "<h3>Chào mừng đến với SecureDoc!</h3>" +
                        "<p>Click vào link dưới đây để kích hoạt tài khoản của bạn:</p>" +
                        "<a href=\"" + link + "\">Kích hoạt ngay</a>" +
                        "<p>Link này sẽ hết hạn sau " + tokenExpirationMinutes + " phút.</p>");
    }

    // --- 4. XÁC THỰC TÀI KHOẢN ---
    public void verifyAccount(String tokenStr) {
        VerificationToken token = tokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new AppException(AppErrorCode.INVALID_TOKEN));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new AppException(AppErrorCode.TOKEN_EXPIRED);
        }

        User user = token.getUser();
        user.setEnabled(true);
        userRepository.save(user);

        tokenRepository.delete(token);
    }

    // --- 5. QUÊN MẬT KHẨU (Gửi lại mail reset) ---
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        // Xóa token reset pass cũ nếu có
        tokenRepository.deleteByUserAndType(user, VerificationToken.TokenType.RESET_PASSWORD);

        VerificationToken token = new VerificationToken(user, VerificationToken.TokenType.RESET_PASSWORD, tokenExpirationMinutes);
        tokenRepository.save(token);

        String link = frontendUrl + "/reset-password?token=" + token.getToken();

        emailService.sendEmail(user.getEmail(), "Đặt lại mật khẩu SecureDoc",
                "<p>Click vào link để đặt lại mật khẩu:</p>" +
                        "<a href=\"" + link + "\">Đặt lại mật khẩu</a>" +
                        "<p>Link này có hiệu lực trong " + tokenExpirationMinutes + " phút.</p>");
    }

    public void resetPassword(ResetPasswordRequest request) {
        VerificationToken token = tokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new AppException(AppErrorCode.INVALID_TOKEN));

        if (token.getExpiryDate().isBefore(LocalDateTime.now()) || token.getType() != VerificationToken.TokenType.RESET_PASSWORD) {
            throw new AppException(AppErrorCode.TOKEN_EXPIRED);
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        // Reset các trạng thái khóa nếu có
        unlockUser(user);

        userRepository.save(user);
        tokenRepository.delete(token);
    }

    // --- 6. GOOGLE LOGIN ---
    public TokenResponse authenticateGoogleUser(GoogleLoginRequest request) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken == null) {
                throw new AppException(AppErrorCode.INVALID_TOKEN);
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            User user;
            if (userRepository.existsByEmail(email)) {
                user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));
            } else {
                user = createGoogleUser(email, name, pictureUrl);
            }

            // Kiểm tra khóa: Logic giống hệt authenticateUser
            if (!user.isAccountNonLocked()) {
                if (user.getLockTime() != null) {
                    // Check thời gian
                    if (user.getLockTime().plusMinutes(lockTimeDuration).isBefore(LocalDateTime.now())) {
                        unlockUser(user);
                    } else {
                        throw new AppException(AppErrorCode.ACCOUNT_LOCKED);
                    }
                } else {
                    // Admin ban
                    throw new AppException(AppErrorCode.ACCOUNT_LOCKED_BY_ADMIN);
                }
            }

            if (!user.isEnabled()) {
                throw new AppException(AppErrorCode.ACCOUNT_NOT_ENABLED);
            }

            UserDetailsImpl userDetails = UserDetailsImpl.build(user);
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = jwtUtils.generateJwtToken(authentication);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority).collect(Collectors.toList());

            accessLogService.logAccess(
                    user.getId(),
                    user.getUsername(),
                    EAccessAction.GOOGLE_LOGIN,
                    true,
                    null,
                    accessLogService.getClientIp(),
                    accessLogService.getUserAgent()
            );

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
            accessLogService.logAccess(
                    null,
                    "Google Login User",
                    EAccessAction.GOOGLE_LOGIN,
                    false,
                    e.getMessage(),
                    accessLogService.getClientIp(),
                    accessLogService.getUserAgent()
            );
            throw e;
        } catch (Exception e) {
            e.printStackTrace();

            accessLogService.logAccess(
                    null,
                    "Google Login User",
                    EAccessAction.GOOGLE_LOGIN,
                    false,
                    e.getMessage(),
                    accessLogService.getClientIp(),
                    accessLogService.getUserAgent()
            );

            throw new AppException(AppErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private User createGoogleUser(String email, String name, String avatarUrl) {
        String baseUsername = email.split("@")[0];
        String username = baseUsername;
        int count = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + count++;
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .fullName(name)
                .avatarUrl(avatarUrl)
                .isEnabled(true)
                .isAccountNonLocked(true)
                .isAccountNonExpired(true)
                .isCredentialsNonExpired(true)
                .build();

        Set<Role> roles = new HashSet<>();
        roles.add(roleRepository.findByName(ERole.ROLE_USER).orElseThrow());
        user.setRoles(roles);

        return userRepository.save(user);
    }
}