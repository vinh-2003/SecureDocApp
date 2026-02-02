/**
 * =============================================================================
 * NAVIGATION CONSTANTS
 * =============================================================================
 * Cấu hình menu navigation cho TabBar và Sidebar
 * Phân chia theo role: User và Admin
 * =============================================================================
 */

// =============================================================================
// USER NAVIGATION
// =============================================================================

/**
 * Các tab hiển thị trên TabBar cho User thường
 */
export const USER_TAB_MENUS = [
    {
        name: 'HomeTab',
        screen: 'DashboardScreen',
        label: 'Trang chủ',
        icon: 'home'
    },
    {
        name: 'SharedTab',
        screen: 'SharedScreen',
        label: 'Được chia sẻ',
        icon: 'share-alt'
    },
    {
        name: 'RecentTab',
        screen: 'RecentScreen',
        label: 'Gần đây',
        icon: 'clock'
    }
];

/**
 * Các mục hiển thị trong Sidebar cho User thường
 * (Những mục KHÔNG có trong TabBar)
 */
export const USER_SIDEBAR_MENUS = [
    {
        screen: 'RequestsScreen',
        label: 'Yêu cầu truy cập',
        icon: 'user-shield'
    },
    {
        screen: 'TrashScreen',
        label: 'Thùng rác',
        icon: 'trash'
    },
    {
        screen: 'ActivitiesScreen',
        label: 'Lịch sử hoạt động',
        icon: 'history'
    }
];

// =============================================================================
// ADMIN NAVIGATION
// =============================================================================

/**
 * Các tab hiển thị trên TabBar cho Admin
 */
export const ADMIN_TAB_MENUS = [
    {
        name: 'MonitorTab',
        screen: 'AdminMonitorScreen',
        label: 'Giám sát',
        icon: 'chart-pie'
    },
    {
        name: 'LogsTab',
        screen: 'AdminLogsScreen',
        label: 'Nhật ký',
        icon: 'clipboard-list'
    },
    {
        name: 'UsersTab',
        screen: 'AdminUsersScreen',
        label: 'Người dùng',
        icon: 'users-cog'
    }
];

/**
 * Các mục hiển thị trong Sidebar cho Admin
 * Bao gồm cả menu User + các tiện ích khác
 */
export const ADMIN_SIDEBAR_MENUS = [
    // Quay về chế độ User
    {
        screen: 'UserDashboard', // <--- SỬA TỪ 'HomeTab' THÀNH 'UserDashboard'
        label: 'Tài liệu của tôi',
        icon: 'folder',
        isUserMode: false // Đặt false vì ta đang navigate stack bình thường
    },
    {
        screen: 'UserShared', // <--- SỬA TỪ 'SharedScreen' THÀNH 'UserShared'
        label: 'Được chia sẻ',
        icon: 'share-alt'
    },
    {
        screen: 'RecentScreen',
        label: 'Gần đây',
        icon: 'clock'
    },
    {
        screen: 'RequestsScreen',
        label: 'Yêu cầu truy cập',
        icon: 'user-shield'
    },
    {
        screen: 'TrashScreen',
        label: 'Thùng rác',
        icon: 'trash'
    },
    {
        screen: 'ActivitiesScreen',
        label: 'Lịch sử hoạt động',
        icon: 'history'
    }
];

// =============================================================================
// COMMON
// =============================================================================

/**
 * Menu cố định ở footer sidebar (cho cả User và Admin)
 */
export const SIDEBAR_FOOTER_MENUS = [
    {
        screen: 'ProfileScreen',
        label: 'Cá nhân',
        icon: 'user-circle'
    }
];