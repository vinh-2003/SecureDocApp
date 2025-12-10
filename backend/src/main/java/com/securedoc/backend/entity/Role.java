package com.securedoc.backend.entity;

import com.securedoc.backend.enums.ERole;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "roles")
public class Role {
    @Id
    private String id;

    private ERole name; // ROLE_ADMIN, ROLE_USER

    private String description;

    // Danh sách permission string: "USER_CREATE", "FILE_GLOBAL_ACCESS"...
    private Set<String> permissions;
}