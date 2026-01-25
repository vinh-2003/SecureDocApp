import DashboardPage from '../pages/Dashboard/DashboardPage';
import SearchPage from '../pages/Search/SearchPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import FileViewerPage from '../pages/FileViewer/FileViewerPage';
import IncomingRequestPage from '../pages/Request/IncomingRequestPage';
import RecentPage from '../pages/Recent/RecentPage';
import TrashPage from '../pages/Trash/TrashPage';
import SharedPage from '../pages/Shared/SharedPage';
import ActivityPage from '../pages/Activity/ActivityPage';
import AdminUserPage from '../pages/Admin/AdminUserPage';
import AccessLogPage from '../pages/Admin/AccessLogPage';
import DocumentMonitorPage from '../pages/Admin/DocumentMonitorPage';

/**
 * Các route được bảo vệ (cần đăng nhập)
 * Lưu ý: element là Component, không phải JSX
 */
const privateRoutes = [
    // Dashboard & Folders
    { path: '/', element: DashboardPage },
    { path: '/folders/:folderId', element: DashboardPage },

    // File Viewer
    { path: '/file/view/:fileId', element: FileViewerPage },

    // Search
    { path: '/search', element: SearchPage },

    // User
    { path: '/profile', element: ProfilePage },

    // File Management
    { path: '/recent', element: RecentPage },
    { path: '/shared', element: SharedPage },
    { path: '/trash', element: TrashPage },

    // Requests
    { path: '/requests', element: IncomingRequestPage },

    { path: '/activities', element: ActivityPage },

    // --- ADMIN ROUTES ---
    { path: '/admin/users', element: AdminUserPage },
    { path: '/admin/logs', element: AccessLogPage },
    { path: '/admin/monitor', element: DocumentMonitorPage },
];

export default privateRoutes;