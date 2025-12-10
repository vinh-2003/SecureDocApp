package com.securedoc.backend.security.services;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.securedoc.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Data
@AllArgsConstructor
public class UserDetailsImpl implements UserDetails {
    private static final long serialVersionUID = 1L;

    private String id;
    private String username;
    private String email;
    @JsonIgnore
    private String password;

    // Danh sách quyền (Spring Security Authority)
    private Collection<? extends GrantedAuthority> authorities;

    // Hàm build từ Entity User -> UserDetailsImpl
    public static UserDetailsImpl build(User user) {
        // Convert Roles & Permissions thành GrantedAuthority
        // Ví dụ: ROLE_ADMIN, USER_CREATE, FILE_DELETE...
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .flatMap(role -> {
                    // Add tên Role
                    List<GrantedAuthority> auths = new java.util.ArrayList<>();
                    auths.add(new SimpleGrantedAuthority(role.getName().name()));
                    // Add từng permission trong role
                    if (role.getPermissions() != null) {
                        role.getPermissions().forEach(permission ->
                                auths.add(new SimpleGrantedAuthority(permission))
                        );
                    }
                    return auths.stream();
                })
                .collect(Collectors.toList());

        return new UserDetailsImpl(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                authorities);
    }

    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return true; }
}