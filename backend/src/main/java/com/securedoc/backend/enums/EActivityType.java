package com.securedoc.backend.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EActivityType {
    // === FILE/FOLDER LIFECYCLE ===
    FILE_UPLOADED("đã tải lên", "upload"),
    FOLDER_CREATED("đã tạo thư mục", "create_folder"),
    // === MODIFICATIONS ===
    RENAMED("đã đổi tên", "rename"),
    DESCRIPTION_UPDATED("đã cập nhật mô tả", "edit"),
    MOVED("đã di chuyển", "move"),
    COPIED("đã tạo bản sao", "copy"),
    // === TRASH OPERATIONS ===
    TRASHED("đã chuyển vào thùng rác", "delete"),
    RESTORED("đã khôi phục", "restore"),
    DELETED_PERMANENTLY("đã xóa vĩnh viễn", "delete_forever"),
    // === SHARING ===
    SHARED("đã chia sẻ", "share"),
    REVOKED("đã thu hồi quyền", "remove_share"),
    PUBLIC_ACCESS_CHANGED("đã thay đổi quyền truy cập chung", "public"),
    // === ACCESS ===
    DOWNLOADED("đã tải xuống", "download"),
    VIEWED("đã xem", "view");

    private final String displayText;  // Text hiển thị tiếng Việt
    private final String iconType;     // Icon type cho Frontend
}
