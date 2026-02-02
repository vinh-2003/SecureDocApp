import axiosClient from '../api/axiosClient';

const adminService = {
    /**
     * Lấy thống kê tài liệu (Dùng cho AdminMonitorScreen)
     * Trả về: { totalSize, totalFiles, totalFolders, trashSize, statusDistribution, ... }
     */
    getDocumentStats: () => {
        return axiosClient.get('/admin/documents/stats');
    },

    /**
     * Lấy danh sách user (Dùng cho AdminUsersScreen sắp tới)
     * Mobile thường dùng FlatList infinite scroll nên page sẽ tăng dần
     */
    getUsers: (page = 0, size = 10, keyword = '', sortBy = 'createdAt', direction = 'desc') => {
        return axiosClient.get('/admin/users', {
            params: { page, size, keyword, sortBy, direction }
        });
    },

    /**
     * Khóa/Mở khóa tài khoản
     */
    updateUserStatus: (userId, isLocked) => {
        return axiosClient.patch(`/admin/users/${userId}/status`, { isLocked });
    },

    /**
     * Cập nhật quyền hạn (Roles)
     */
    updateUserRoles: (userId, roles) => {
        return axiosClient.put(`/admin/users/${userId}/roles`, { roles });
    },

    /**
     * Lấy danh sách Access Logs (Dùng cho AdminLogsScreen sắp tới)
     */
    getAccessLogs: (page = 0, size = 20, keyword = '', action = 'ALL') => {
        return axiosClient.get('/admin/access-logs', {
            params: { page, size, keyword, action }
        });
    },

    /**
     * Lấy danh sách file lỗi (Dùng khi bấm vào nút "Xem chi tiết" ở Monitor)
     */
    getFailedFiles: (page = 0, size = 10) => {
        return axiosClient.get('/admin/documents/failed', {
            params: { page, size }
        });
    }
};

export default adminService;