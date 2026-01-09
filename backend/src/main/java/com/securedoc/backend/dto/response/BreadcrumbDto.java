package com.securedoc.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BreadcrumbDto {
    private String id;
    private String name;

    // TRƯỜNG QUAN TRỌNG: Để Frontend biết folder này của ai
    private String ownerId;

    private UserPermissions permissions;
}