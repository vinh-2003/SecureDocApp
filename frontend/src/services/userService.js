import axiosClient from '../api/axiosClient';

/**
 * =============================================================================
 * USER SERVICE
 * =============================================================================
 * Service xử lý các API liên quan đến user: 
 * - Profile management
 * - User lookup
 * - Password management
 * =============================================================================
 */

// =============================================================================
// PROFILE MANAGEMENT
// =============================================================================

/**
 * Lấy thông tin profile của user hiện tại
 * @returns {Promise} Response chứa user profile data
 */
const getProfile = () => {
    return axiosClient.get('/users/profile');
};

/**
 * Cập nhật thông tin profile
 * @param {FormData} formData - FormData chứa các trường cần cập nhật
 * @param {string} [formData.fullName] - Họ tên
 * @param {string} [formData.phone] - Số điện thoại
 * @param {File} [formData. avatar] - File ảnh đại diện
 * @returns {Promise} Response chứa profile đã cập nhật
 */
const updateProfile = (formData) => {
    return axiosClient.put('/users/profile', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

/**
 * Cập nhật chỉ avatar
 * @param {File} avatarFile - File ảnh đại diện mới
 * @returns {Promise} Response chứa URL avatar mới
 */
const updateAvatar = (avatarFile) => {
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    return axiosClient.put('/users/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// =============================================================================
// USER LOOKUP
// =============================================================================

/**
 * Tìm user theo email (dùng cho tính năng share)
 * @param {string} email - Email cần tìm
 * @returns {Promise} Response chứa user info nếu tìm thấy
 */
const findUserByEmail = (email) => {
    return axiosClient.get('/users/find-by-email', {
        params: { email }
    });
};

/**
 * Lấy thông tin user theo ID
 * @param {string} id - User ID
 * @returns {Promise} Response chứa user info
 */
const getUserById = (id) => {
    return axiosClient.get(`/users/${id}`);
};

/**
 * Tìm kiếm users theo từ khóa (username hoặc email)
 * @param {string} query - Từ khóa tìm kiếm
 * @param {number} [limit=10] - Số lượng kết quả tối đa
 * @returns {Promise} Response chứa danh sách users
 */
const searchUsers = (query, limit = 10) => {
    return axiosClient.get('/users/search', {
        params: { query, limit }
    });
};

// =============================================================================
// PASSWORD MANAGEMENT
// =============================================================================

/**
 * Đổi mật khẩu
 * @param {Object} data - Dữ liệu đổi mật khẩu
 * @param {string} data.currentPassword - Mật khẩu hiện tại
 * @param {string} data. newPassword - Mật khẩu mới
 * @param {string} [data.confirmPassword] - Xác nhận mật khẩu mới
 * @returns {Promise} Response
 */
const changePassword = (data) => {
    return axiosClient.put('/users/change-password', data);
};

// =============================================================================
// EXPORT
// =============================================================================

const userService = {
    // Profile Management
    getProfile,
    updateProfile,
    updateAvatar,

    // User Lookup
    findUserByEmail,
    getUserById,
    searchUsers,

    // Password Management
    changePassword,
};

export default userService;