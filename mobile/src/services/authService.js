import axiosClient from '../api/axiosClient';

/**
 * =============================================================================
 * AUTH SERVICE (REACT NATIVE VERSION)
 * =============================================================================
 * Service xử lý tất cả API liên quan đến authentication:
 * - Đăng nhập / Đăng ký
 * - OAuth (Google)
 * - Xác thực email
 * - Quên / Đặt lại mật khẩu
 * - Đăng xuất
 * =============================================================================
 */

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Đăng nhập bằng username và password
 * @param {string} username - Tên đăng nhập
 * @param {string} password - Mật khẩu
 * @returns {Promise} Response chứa user info và tokens
 */
const login = (username, password) => {
    return axiosClient.post('/auth/signin', { username, password });
};

/**
 * Đăng ký tài khoản mới
 * @param {Object} data - Thông tin đăng ký
 * @param {string} data.username - Tên đăng nhập
 * @param {string} data.email - Email
 * @param {string} data.password - Mật khẩu
 * @param {string} [data.fullName] - Họ tên đầy đủ
 * @returns {Promise} Response
 */
const register = (data) => {
    return axiosClient.post('/auth/signup', data);
};

/**
 * Đăng xuất
 * @returns {Promise} Response
 */
const logout = () => {
    return axiosClient.post('/auth/signout');
};

// =============================================================================
// OAUTH
// =============================================================================

/**
 * Đăng nhập bằng Google OAuth
 * @param {string} idToken - ID Token từ Google
 * @returns {Promise} Response chứa user info và tokens
 */
const googleLogin = (idToken) => {
    return axiosClient.post('/auth/google', { idToken });
};

// =============================================================================
// EMAIL VERIFICATION
// =============================================================================

/**
 * Xác thực email qua token
 * @param {string} token - Token xác thực từ email
 * @returns {Promise} Response
 */
const verifyAccount = (token) => {
    return axiosClient.get('/auth/verify', {
        params: { token }
    });
};

/**
 * Gửi lại email xác thực
 * @param {string} email - Email cần gửi lại
 * @returns {Promise} Response
 */
const resendVerification = (email) => {
    return axiosClient.post('/auth/resend-verification', null, {
        params: { email }
    });
};

// =============================================================================
// PASSWORD RESET
// =============================================================================

/**
 * Yêu cầu đặt lại mật khẩu (gửi email)
 * @param {string} email - Email đã đăng ký
 * @returns {Promise} Response
 */
const forgotPassword = (email) => {
    return axiosClient.post('/auth/forgot-password', null, {
        params: { email }
    });
};

/**
 * Đặt lại mật khẩu mới
 * @param {string} token - Token từ email reset password
 * @param {string} newPassword - Mật khẩu mới
 * @returns {Promise} Response
 */
const resetPassword = (token, newPassword) => {
    return axiosClient.post('/auth/reset-password', { token, newPassword });
};

/**
 * Đổi mật khẩu (khi đã đăng nhập)
 * @param {string} currentPassword - Mật khẩu hiện tại
 * @param {string} newPassword - Mật khẩu mới
 * @returns {Promise} Response
 */
const changePassword = (currentPassword, newPassword) => {
    return axiosClient.put('/auth/change-password', {
        currentPassword,
        newPassword
    });
};

// =============================================================================
// EXPORT
// =============================================================================

const authService = {
    // Authentication
    login,
    register,
    logout,

    // OAuth
    googleLogin,

    // Email Verification
    verifyAccount,
    resendVerification,

    // Password Reset
    forgotPassword,
    resetPassword,
    changePassword,
};

export default authService;