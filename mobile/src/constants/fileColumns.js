// src/constants/fileColumns.js

/**
 * Định nghĩa Key cho các cột dữ liệu
 */
export const LIST_COLUMNS = {
    CHECKBOX: 'checkbox',
    NAME: 'name',
    SIZE: 'size',
    OWNER: 'owner',
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
    SHARED_AT: 'sharedAt',
    DELETED_AT: 'deletedAt',
    ACCESSED_AT: 'accessedAt',
    STATUS: 'status',
    ACTIONS: 'actions'
};

/**
 * Cấu hình cột mặc định cho Dashboard (Mobile có thể ẩn bớt cột trên UI)
 */
export const DASHBOARD_COLUMNS = [
    { key: LIST_COLUMNS.CHECKBOX, label: 'Chọn', required: true },
    { key: LIST_COLUMNS.NAME, label: 'Tên', required: true },
    { key: LIST_COLUMNS.SIZE, label: 'Kích thước', required: false },
    { key: LIST_COLUMNS.UPDATED_AT, label: 'Sửa đổi', required: false },
    { key: LIST_COLUMNS.ACTIONS, label: 'Hành động', required: true }
];

// Các cấu hình khác giữ nguyên key để logic search/sort hoạt động
export const SEARCH_COLUMNS = DASHBOARD_COLUMNS;
export const SHARED_COLUMNS = DASHBOARD_COLUMNS;
export const RECENT_COLUMNS = DASHBOARD_COLUMNS;
export const TRASH_COLUMNS = DASHBOARD_COLUMNS;

/**
 * Các cột hiển thị mặc định
 */
export const DEFAULT_VISIBLE_COLUMNS = [
    LIST_COLUMNS.CHECKBOX,
    LIST_COLUMNS.NAME,
    LIST_COLUMNS.SIZE,
    LIST_COLUMNS.UPDATED_AT,
    LIST_COLUMNS.ACTIONS
];