/**
 * Định nghĩa các loại activity và thông tin hiển thị
 * (Chuyển từ web, thay Tailwind CSS bằng màu React Native)
 */
export const ACTIVITY_TYPES = {
    FILE_UPLOADED: {
        key: 'FILE_UPLOADED',
        label: 'Tải lên',
        color: '#059669',      // green-600
        bgColor: '#D1FAE5',    // green-100
        icon: 'upload'
    },
    FOLDER_CREATED: {
        key: 'FOLDER_CREATED',
        label: 'Tạo thư mục',
        color: '#2563EB',      // blue-600
        bgColor: '#DBEAFE',    // blue-100
        icon: 'folder-plus'
    },
    RENAMED: {
        key: 'RENAMED',
        label: 'Đổi tên',
        color: '#7C3AED',      // purple-600
        bgColor: '#EDE9FE',    // purple-100
        icon: 'edit'
    },
    DESCRIPTION_UPDATED: {
        key: 'DESCRIPTION_UPDATED',
        label: 'Cập nhật mô tả',
        color: '#4F46E5',      // indigo-600
        bgColor: '#E0E7FF',    // indigo-100
        icon: 'file-alt'
    },
    MOVED: {
        key: 'MOVED',
        label: 'Di chuyển',
        color: '#EA580C',      // orange-600
        bgColor: '#FFEDD5',    // orange-100
        icon: 'arrows-alt'
    },
    COPIED: {
        key: 'COPIED',
        label: 'Sao chép',
        color: '#0891B2',      // cyan-600
        bgColor: '#CFFAFE',    // cyan-100
        icon: 'copy'
    },
    TRASHED: {
        key: 'TRASHED',
        label: 'Xóa',
        color: '#DC2626',      // red-600
        bgColor: '#FEE2E2',    // red-100
        icon: 'trash'
    },
    RESTORED: {
        key: 'RESTORED',
        label: 'Khôi phục',
        color: '#059669',      // emerald-600
        bgColor: '#D1FAE5',    // emerald-100
        icon: 'undo'
    },
    DELETED_PERMANENTLY: {
        key: 'DELETED_PERMANENTLY',
        label: 'Xóa vĩnh viễn',
        color: '#E11D48',      // rose-600
        bgColor: '#FFE4E6',    // rose-100
        icon: 'trash-alt'
    },
    SHARED: {
        key: 'SHARED',
        label: 'Chia sẻ',
        color: '#0284C7',      // sky-600
        bgColor: '#E0F2FE',    // sky-100
        icon: 'share-alt'
    },
    REVOKED: {
        key: 'REVOKED',
        label: 'Thu hồi quyền',
        color: '#D97706',      // amber-600
        bgColor: '#FEF3C7',    // amber-100
        icon: 'user-minus'
    },
    PUBLIC_ACCESS_CHANGED: {
        key: 'PUBLIC_ACCESS_CHANGED',
        label: 'Đổi quyền công khai',
        color: '#0D9488',      // teal-600
        bgColor: '#CCFBF1',    // teal-100
        icon: 'globe'
    },
    DOWNLOADED: {
        key: 'DOWNLOADED',
        label: 'Tải xuống',
        color: '#7C3AED',      // violet-600
        bgColor: '#EDE9FE',    // violet-100
        icon: 'download'
    },
    VIEWED: {
        key: 'VIEWED',
        label: 'Xem',
        color: '#4B5563',      // gray-600
        bgColor: '#F3F4F6',    // gray-100
        icon: 'eye'
    }
};

/**
 * Nhóm activity theo danh mục (cho filter - nếu cần sau này)
 */
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