package com.securedoc.backend.enums;

import lombok.Getter;

@Getter
public enum EPermissionRole {
    // Định nghĩa các Role và Trọng số (Level)
    VIEWER(1),      // Chỉ xem
    COMMENTER(2),   // Xem + Bình luận
    EDITOR(3);      // Toàn quyền sửa đổi

    private final int level;

    EPermissionRole(int level) {
        this.level = level;
    }

    // --- CÁC HÀM HELPER KIỂM TRA QUYỀN ---

    /**
     * Kiểm tra xem Role hiện tại có quyền "Sửa" không?
     * (Tức là Level phải >= EDITOR)
     */
    public boolean canEdit() {
        return this.level >= EDITOR.level;
    }

    /**
     * Kiểm tra xem Role hiện tại có quyền "Bình luận" không?
     */
    public boolean canComment() {
        return this.level >= COMMENTER.level;
    }

    /**
     * Kiểm tra xem Role hiện tại có quyền "Xem" không?
     */
    public boolean canView() {
        return this.level >= VIEWER.level;
    }

    /**
     * So sánh quyền: Kiểm tra xem Role này có "mạnh hơn hoặc bằng" Role kia không?
     */
    public boolean isAtLeast(EPermissionRole otherRole) {
        return this.level >= otherRole.level;
    }
}