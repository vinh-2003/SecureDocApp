package com.securedoc.backend.service;

import com.securedoc.backend.dto.auth.LoginRequest;
import com.securedoc.backend.dto.auth.RegisterRequest;
import com.securedoc.backend.dto.auth.TokenResponse;
import com.securedoc.backend.entity.RefreshToken;
import com.securedoc.backend.entity.Role;
import com.securedoc.backend.entity.User;
import com.securedoc.backend.enums.ERole;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.repository.RoleRepository;
import com.securedoc.backend.repository.UserRepository;
import com.securedoc.backend.security.jwt.JwtUtils;
import com.securedoc.backend.security.services.RefreshTokenService;
import com.securedoc.backend.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
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

    // --- 1. ĐĂNG NHẬP ---
    public TokenResponse authenticateUser(LoginRequest loginRequest) {
        try {
            // Xác thực qua Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Lấy thông tin User từ Principal
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            // Sinh Access Token
            String jwt = jwtUtils.generateJwtToken(authentication);

            // Sinh Refresh Token
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());

            // Lấy danh sách quyền (Roles) từ UserDetails
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            // Trả về Response đầy đủ (Sử dụng Builder của Lombok)
            return TokenResponse.builder()
                    .accessToken(jwt)
                    .refreshToken(refreshToken.getToken())
                    .userId(userDetails.getId())
                    .username(userDetails.getUsername())
                    .email(userDetails.getEmail())
                    .roles(roles) // Trả về roles để Frontend phân quyền menu
                    .build();

        } catch (Exception e) {
            // Bắt lỗi sai pass hoặc user không tồn tại
            throw new AppException(AppErrorCode.INVALID_CREDENTIALS);
        }
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
                .password(passwordEncoder.encode(signUpRequest.getPassword())) // Hash pass
                .fullName(signUpRequest.getFullName())
                .isEnabled(true)
                .isAccountNonLocked(true)
                .isAccountNonExpired(true)
                .isCredentialsNonExpired(true)
                .build();

        // Gán Role mặc định là USER
        Set<Role> roles = new HashSet<>();

        // Tìm Role trong DB, nếu không có thì báo lỗi (Lỗi hệ thống nghiêm trọng nếu thiếu Role)
        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Error: Role 'ROLE_USER' is not found in Database. Check DatabaseInitializer."));

        roles.add(userRole);
        user.setRoles(roles);

        userRepository.save(user);
    }
}