package com.securedoc.backend.dto.admin;

import lombok.Data;
import java.util.Set;

@Data
public class UpdateUserRoleRequest {
    private Set<String> roles; // VD: ["ROLE_ADMIN", "ROLE_USER"]
}