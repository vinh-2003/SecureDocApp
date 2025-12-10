package com.securedoc.backend.enums;

import lombok.Getter;

@Getter
public enum EPublicAccess {
    PRIVATE(0),         // Riêng tư
    PUBLIC_VIEW(1),     // Bất kỳ ai có link đều xem được
    PUBLIC_EDIT(2);     // Bất kỳ ai có link đều sửa được

    private final int level;

    EPublicAccess(int level) {
        this.level = level;
    }

    /**
     * Kiểm tra xem quyền này có "mở" hơn hoặc bằng quyền kia không?
     */
    public boolean isAtLeast(EPublicAccess other) {
        return this.level >= other.level;
    }
}