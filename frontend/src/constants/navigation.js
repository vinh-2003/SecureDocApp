import {
    FaFolder, FaShareAlt, FaClock, FaTrash, FaUserShield
} from 'react-icons/fa';

/**
 * Cấu hình menu navigation cho Sidebar
 */
export const SIDEBAR_MENUS = [
    {
        path: '/',
        name: 'Tài liệu của tôi',
        icon: FaFolder,
        exact: true
    },
    {
        path: '/shared',
        name: 'Được chia sẻ',
        icon: FaShareAlt
    },
    {
        path: '/requests',
        name: 'Yêu cầu truy cập',
        icon: FaUserShield
    },
    {
        path: '/recent',
        name: 'Gần đây',
        icon: FaClock
    },
    {
        path: '/trash',
        name: 'Thùng rác',
        icon: FaTrash
    },
];

/**
 * Các định dạng file được phép upload
 */
export const ALLOWED_FILE_EXTENSIONS = ['pdf', 'doc', 'docx'];

export const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml. document'
];

/**
 * Accept string cho input file
 */
export const FILE_ACCEPT = '. pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument. wordprocessingml.document';