// Định nghĩa các loại activity và thông tin hiển thị
export const ACTIVITY_TYPES = {
    FILE_UPLOADED: {
        key: 'FILE_UPLOADED',
        label: 'Tải lên',
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        icon: 'upload'
    },
    FOLDER_CREATED: {
        key: 'FOLDER_CREATED',
        label: 'Tạo thư mục',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: 'folder-plus'
    },
    RENAMED: {
        key: 'RENAMED',
        label: 'Đổi tên',
        color: 'purple',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
        icon: 'edit'
    },
    DESCRIPTION_UPDATED: {
        key: 'DESCRIPTION_UPDATED',
        label: 'Cập nhật mô tả',
        color: 'indigo',
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-700',
        icon: 'file-text'
    },
    MOVED: {
        key: 'MOVED',
        label: 'Di chuyển',
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        icon: 'move'
    },
    COPIED: {
        key: 'COPIED',
        label: 'Sao chép',
        color: 'cyan',
        bgColor: 'bg-cyan-100',
        textColor: 'text-cyan-700',
        icon: 'copy'
    },
    TRASHED: {
        key: 'TRASHED',
        label: 'Xóa',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        icon: 'trash'
    },
    RESTORED: {
        key: 'RESTORED',
        label: 'Khôi phục',
        color: 'emerald',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-700',
        icon: 'refresh'
    },
    DELETED_PERMANENTLY: {
        key: 'DELETED_PERMANENTLY',
        label: 'Xóa vĩnh viễn',
        color: 'rose',
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-700',
        icon: 'trash-2'
    },
    SHARED: {
        key: 'SHARED',
        label: 'Chia sẻ',
        color: 'sky',
        bgColor: 'bg-sky-100',
        textColor: 'text-sky-700',
        icon: 'share'
    },
    REVOKED: {
        key: 'REVOKED',
        label: 'Thu hồi quyền',
        color: 'amber',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        icon: 'user-minus'
    },
    PUBLIC_ACCESS_CHANGED: {
        key: 'PUBLIC_ACCESS_CHANGED',
        label: 'Đổi quyền công khai',
        color: 'teal',
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-700',
        icon: 'globe'
    },
    DOWNLOADED: {
        key: 'DOWNLOADED',
        label: 'Tải xuống',
        color: 'violet',
        bgColor: 'bg-violet-100',
        textColor: 'text-violet-700',
        icon: 'download'
    },
    VIEWED: {
        key: 'VIEWED',
        label: 'Xem',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
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