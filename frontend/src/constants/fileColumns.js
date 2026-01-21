import { LIST_COLUMNS } from '../components/FileExplorer';

/**
 * Cấu hình cột mặc định cho Dashboard
 */
export const DASHBOARD_COLUMNS = [
    { key: LIST_COLUMNS.CHECKBOX, label: 'Checkbox', required: true },
    { key: LIST_COLUMNS.NAME, label: 'Tên', required: true },
    { key: LIST_COLUMNS.SIZE, label: 'Kích thước', required: false },
    { key: LIST_COLUMNS.OWNER, label: 'Chủ sở hữu', required: false },
    { key: LIST_COLUMNS.CREATED_AT, label: 'Ngày tạo', required: false },
    { key: LIST_COLUMNS.UPDATED_AT, label: 'Ngày sửa đổi', required: false },
    { key: LIST_COLUMNS.STATUS, label: 'Trạng thái', required: false },
    { key: LIST_COLUMNS.ACTIONS, label: 'Hành động', required: true }
];

/**
 * Cấu hình cột cho Search Page
 */
export const SEARCH_COLUMNS = [
    { key: LIST_COLUMNS.CHECKBOX, label: 'Checkbox', required: true },
    { key: LIST_COLUMNS.NAME, label: 'Tên', required: true },
    { key: LIST_COLUMNS.OWNER, label: 'Chủ sở hữu', required: false },
    { key: LIST_COLUMNS.SIZE, label: 'Kích thước', required: false },
    { key: LIST_COLUMNS.UPDATED_AT, label: 'Ngày sửa đổi', required: false },
    { key: LIST_COLUMNS.ACTIONS, label: 'Hành động', required: true }
];

/**
 * Cấu hình cột cho Shared Page
 */
export const SHARED_COLUMNS = [
    { key: LIST_COLUMNS.CHECKBOX, label: 'Checkbox', required: true },
    { key: LIST_COLUMNS.NAME, label: 'Tên', required: true },
    { key: LIST_COLUMNS.OWNER, label: 'Chia sẻ bởi', required: true },
    { key: LIST_COLUMNS.SHARED_AT, label: 'Ngày chia sẻ', required: false },
    { key: LIST_COLUMNS.SIZE, label: 'Kích thước', required: false },
    { key: LIST_COLUMNS.ACTIONS, label: 'Hành động', required: true }
];

/**
 * Cấu hình cột cho Recent Page
 */
export const RECENT_COLUMNS = [
    { key: LIST_COLUMNS.CHECKBOX, label: 'Checkbox', required: true },
    { key: LIST_COLUMNS.NAME, label: 'Tên', required: true },
    { key: LIST_COLUMNS.ACCESSED_AT, label: 'Thời điểm mở', required: true },
    { key: LIST_COLUMNS.SIZE, label: 'Kích thước', required: false },
    { key: LIST_COLUMNS.ACTIONS, label: 'Hành động', required: true }
];

/**
 * Cấu hình cột cho Trash Page
 */
export const TRASH_COLUMNS = [
    { key: LIST_COLUMNS.CHECKBOX, label: 'Checkbox', required: true },
    { key: LIST_COLUMNS.NAME, label: 'Tên', required: true },
    { key: LIST_COLUMNS.SIZE, label: 'Kích thước', required: false },
    { key: LIST_COLUMNS.DELETED_AT, label: 'Ngày xóa', required: false },
    { key: LIST_COLUMNS.ACTIONS, label: 'Hành động', required: true }
];

/**
 * Các cột hiển thị mặc định cho Dashboard
 */
export const DEFAULT_VISIBLE_COLUMNS = [
    LIST_COLUMNS.CHECKBOX,
    LIST_COLUMNS.NAME,
    LIST_COLUMNS.SIZE,
    LIST_COLUMNS.UPDATED_AT,
    LIST_COLUMNS.ACTIONS
];

/**
 * Các cột hiển thị mặc định cho Search
 */
export const SEARCH_VISIBLE_COLUMNS = [
    LIST_COLUMNS.CHECKBOX,
    LIST_COLUMNS.NAME,
    LIST_COLUMNS.OWNER,
    LIST_COLUMNS.UPDATED_AT,
    LIST_COLUMNS.ACTIONS
];

/**
 * Các cột hiển thị mặc định cho Shared
 */
export const SHARED_VISIBLE_COLUMNS = [
    LIST_COLUMNS.CHECKBOX,
    LIST_COLUMNS.NAME,
    LIST_COLUMNS.OWNER,
    LIST_COLUMNS.SHARED_AT,
    LIST_COLUMNS.ACTIONS
];

/**
 * Các cột hiển thị mặc định cho Recent
 */
export const RECENT_VISIBLE_COLUMNS = [
    LIST_COLUMNS.CHECKBOX,
    LIST_COLUMNS.NAME,
    LIST_COLUMNS.ACCESSED_AT,
    LIST_COLUMNS.SIZE,
    LIST_COLUMNS.ACTIONS
];

/**
 * Các cột hiển thị mặc định cho Trash
 */
export const TRASH_VISIBLE_COLUMNS = [
    LIST_COLUMNS.CHECKBOX,
    LIST_COLUMNS.NAME,
    LIST_COLUMNS.SIZE,
    LIST_COLUMNS.DELETED_AT,
    LIST_COLUMNS.ACTIONS
];