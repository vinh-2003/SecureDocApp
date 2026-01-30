/**
 * Cấu hình menu navigation cho Sidebar
 * icon: Tên icon trong bộ FontAwesome5 của @expo/vector-icons
 */
export const SIDEBAR_MENUS = [
    {
        path: '/', 
        screen: 'Dashboard', // Tên màn hình trong React Navigation
        name: 'Tài liệu của tôi',
        icon: 'folder', 
        exact: true
    },
    {
        path: '/shared',
        screen: 'Shared',
        name: 'Được chia sẻ',
        icon: 'share-alt'
    },
    {
        path: '/requests',
        screen: 'Requests',
        name: 'Yêu cầu truy cập',
        icon: 'user-shield'
    },
    {
        path: '/recent',
        screen: 'Recent',
        name: 'Gần đây',
        icon: 'clock'
    },
    {
        path: '/trash',
        screen: 'Trash',
        name: 'Thùng rác',
        icon: 'trash'
    },
    {
        path: '/activities',
        screen: 'Activities',
        name: 'Lịch sử',
        icon: 'history'
    },
];

/**
 * Menu dành riêng cho Admin
 */
export const ADMIN_SIDEBAR_MENUS = [
    {
        path: '/admin/users',
        screen: 'AdminUsers',
        name: 'Quản lý người dùng',
        icon: 'users-cog',
        exact: true
    },
    {
        path: '/admin/logs',
        screen: 'AdminLogs',
        name: 'Nhật ký hệ thống',
        icon: 'clipboard-list',
        exact: true
    },
    {
        path: '/admin/monitor',
        screen: 'AdminMonitor',
        name: 'Giám sát tài liệu',
        icon: 'chart-pie', // Icon biểu đồ tròn
        exact: true
    }
];