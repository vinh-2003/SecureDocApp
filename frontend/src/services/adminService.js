import axiosClient from '../api/axiosClient';

const adminService = {
    /**
     * Lấy danh sách user có phân trang và tìm kiếm
     */
    getUsers: (page = 0, size = 10, keyword = '', sortBy = 'createdAt', direction = 'desc') => {
        return axiosClient.get('/admin/users', {
            params: { page, size, keyword, sortBy, direction }
        });
    },

    /**
     * Khóa hoặc mở khóa tài khoản
     * Backend xử lý: Nếu lock -> set lockTime = null (khóa vĩnh viễn)
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
     * Lấy danh sách Access Logs
     * @param {number} page
     * @param {number} size
     * @param {string} keyword - Tìm theo username hoặc IP
     * @param {string} action - Lọc theo hành động (LOGIN, LOGOUT...) hoặc ALL
     */
    getAccessLogs: (page = 0, size = 20, keyword = '', action = 'ALL') => {
        return axiosClient.get('/admin/access-logs', {
            params: { page, size, keyword, action }
        });
    },

    /**
     * Lấy thống kê tài liệu (Dashboard)
     */
    getDocumentStats: () => {
        return axiosClient.get('/admin/documents/stats');
    },

    /**
     * Lấy danh sách file lỗi
     */
    getFailedFiles: (page = 0, size = 10) => {
        return axiosClient.get('/admin/documents/failed', {
            params: { page, size }
        });
    }
};

export default adminService;