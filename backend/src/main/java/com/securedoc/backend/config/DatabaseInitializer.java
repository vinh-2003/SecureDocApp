package com.securedoc.backend.config;

import com.securedoc.backend.entity.Role;
import com.securedoc.backend.entity.User;
import com.securedoc.backend.enums.ERole;
import com.securedoc.backend.repository.RoleRepository;
import com.securedoc.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            log.info("--- STARTING DATABASE INITIALIZATION ---");

            // 1. Khởi tạo Roles nếu chưa có
            createRoleIfNotFound(ERole.ROLE_ADMIN, Set.of(
                    "USER_MANAGE", "USER_DELETE", "FILE_GLOBAL_ACCESS", "SYSTEM_CONFIG"
            ));

            createRoleIfNotFound(ERole.ROLE_USER, Set.of(
                    "FILE_UPLOAD", "FILE_READ_OWNED", "FILE_SHARE"
            ));

            // 2. Khởi tạo Tài khoản Admin nếu chưa có
            if (!userRepository.existsByUsername("admin")) {
                Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN).orElseThrow();
                Role userRole = roleRepository.findByName(ERole.ROLE_USER).orElseThrow();

                User admin = User.builder()
                        .username("admin")
                        .email("admin@securedoc.com")
                        .password(passwordEncoder.encode("admin123")) // Pass mặc định
                        .fullName("Super Administrator")
                        .roles(Set.of(adminRole, userRole))
                        .isEnabled(true)
                        .isAccountNonLocked(true)
                        .isAccountNonExpired(true)
                        .isCredentialsNonExpired(true)
                        .build();

                userRepository.save(admin);
                log.info(">>> Admin account created: admin / admin123");
            } else {
                log.info(">>> Admin account already exists.");
            }

            log.info("--- DATABASE INITIALIZATION FINISHED ---");
        };
    }

    private void createRoleIfNotFound(ERole name, Set<String> permissions) {
        if (roleRepository.findByName(name).isEmpty()) {
            Role role = Role.builder()
                    .name(name)
                    .permissions(permissions)
                    .description("Default " + name.name())
                    .build();
            roleRepository.save(role);
            log.info(">>> Role created: " + name);
        }
    }
}