import {
    FaFolder, FaShareAlt, FaClock, FaTrash, FaUserShield, FaHistory, FaUsersCog, FaClipboardList, FaChartPie
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
    {
        path: '/activities',
        name: 'Lịch sử',
        icon: FaHistory
    },
];

/**
 * Menu dành riêng cho Admin
 */
export const ADMIN_SIDEBAR_MENUS = [
    {
        path: '/admin/users',
        name: 'Quản lý người dùng',
        icon: FaUsersCog,
        exact: true
    },
    {
        path: '/admin/logs',
        name: 'Nhật ký truy cập',
        icon: FaClipboardList,
        exact: true
    },
    {
        path: '/admin/monitor',
        name: 'Giám sát tài liệu',
        icon: FaChartPie,
        exact: true
    }
];