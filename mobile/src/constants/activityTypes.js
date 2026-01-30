// src/constants/activityTypes.js

// Định nghĩa các loại activity và thông tin hiển thị
export const ACTIVITY_TYPES = {
    FILE_UPLOADED: {
        key: 'FILE_UPLOADED',
        label: 'Tải lên',
        color: '#15803d', // green-700
        bgColor: '#dcfce7', // green-100
        icon: 'file-upload' // FA5 Name
    },
    FOLDER_CREATED: {
        key: 'FOLDER_CREATED',
        label: 'Tạo thư mục',
        color: '#1d4ed8', // blue-700
        bgColor: '#dbeafe', // blue-100
        icon: 'folder-plus'
    },
    RENAMED: {
        key: 'RENAMED',
        label: 'Đổi tên',
        color: '#7e22ce', // purple-700
        bgColor: '#f3e8ff', // purple-100
        icon: 'edit'
    },
    DESCRIPTION_UPDATED: {
        key: 'DESCRIPTION_UPDATED',
        label: 'Cập nhật mô tả',
        color: '#4338ca', // indigo-700
        bgColor: '#e0e7ff', // indigo-100
        icon: 'file-alt'
    },
    MOVED: {
        key: 'MOVED',
        label: 'Di chuyển',
        color: '#c2410c', // orange-700
        bgColor: '#ffedd5', // orange-100
        icon: 'arrows-alt'
    },
    COPIED: {
        key: 'COPIED',
        label: 'Sao chép',
        color: '#0e7490', // cyan-700
        bgColor: '#cffafe', // cyan-100
        icon: 'copy'
    },
    TRASHED: {
        key: 'TRASHED',
        label: 'Xóa',
        color: '#b91c1c', // red-700
        bgColor: '#fee2e2', // red-100
        icon: 'trash'
    },
    RESTORED: {
        key: 'RESTORED',
        label: 'Khôi phục',
        color: '#047857', // emerald-700
        bgColor: '#d1fae5', // emerald-100
        icon: 'sync-alt'
    },
    DELETED_PERMANENTLY: {
        key: 'DELETED_PERMANENTLY',
        label: 'Xóa vĩnh viễn',
        color: '#be123c', // rose-700
        bgColor: '#ffe4e6', // rose-100
        icon: 'times-circle'
    },
    SHARED: {
        key: 'SHARED',
        label: 'Chia sẻ',
        color: '#0369a1', // sky-700
        bgColor: '#e0f2fe', // sky-100
        icon: 'share-alt'
    },
    REVOKED: {
        key: 'REVOKED',
        label: 'Thu hồi quyền',
        color: '#b45309', // amber-700
        bgColor: '#fef3c7', // amber-100
        icon: 'user-slash'
    },
    PUBLIC_ACCESS_CHANGED: {
        key: 'PUBLIC_ACCESS_CHANGED',
        label: 'Đổi quyền công khai',
        color: '#0f766e', // teal-700
        bgColor: '#ccfbf1', // teal-100
        icon: 'globe'
    },
    DOWNLOADED: {
        key: 'DOWNLOADED',
        label: 'Tải xuống',
        color: '#6d28d9', // violet-700
        bgColor: '#ede9fe', // violet-100
        icon: 'file-download'
    },
    VIEWED: {
        key: 'VIEWED',
        label: 'Xem',
        color: '#374151', // gray-700
        bgColor: '#f3f4f6', // gray-100
        icon: 'eye'
    }
};

// Nhóm activity theo danh mục (cho filter)
export const ACTIVITY_GROUPS = {
    all: {
        label: 'Tất cả',
        types: null
    },
    lifecycle: {
        label: 'Tạo & Xóa',
        types: ['FILE_UPLOADED', 'FOLDER_CREATED', 'TRASHED', 'RESTORED', 'DELETED_PERMANENTLY']
    },
    modifications: {
        label: 'Chỉnh sửa',
        types: ['RENAMED', 'DESCRIPTION_UPDATED', 'MOVED', 'COPIED']
    },
    sharing: {
        label: 'Chia sẻ',
        types: ['SHARED', 'REVOKED', 'PUBLIC_ACCESS_CHANGED']
    },
    access: {
        label: 'Truy cập',
        types: ['DOWNLOADED', 'VIEWED']
    }
};

export default ACTIVITY_TYPES;