package com.securedoc.backend.dto.admin;

import lombok.Data;

@Data
public class UpdateUserStatusRequest {
    private Boolean isLocked; // true = khóa, false = mở
}