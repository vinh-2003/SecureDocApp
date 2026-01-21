import axios from 'axios';

/**
 * =============================================================================
 * AXIOS CLIENT
 * =============================================================================
 * HTTP Client được cấu hình sẵn với: 
 * - Base URL từ environment
 * - Auto attach Access Token
 * - Auto refresh token khi hết hạn
 * - Xử lý response/error thống nhất
 * =============================================================================
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Các endpoints không cần token hoặc cần xử lý đặc biệt
const AUTH_ENDPOINTS = [
  '/auth/signin',
  '/auth/signup',
  '/auth/refreshtoken',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify'
];

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user'
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Lấy access token từ localStorage
 * @returns {string|null}
 */
const getAccessToken = () => {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Lấy refresh token từ localStorage
 * @returns {string|null}
 */
const getRefreshToken = () => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Lưu access token vào localStorage
 * @param {string} token
 */
const setAccessToken = (token) => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

/**
 * Xóa tất cả auth data và redirect về login
 */
const clearAuthAndRedirect = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);

  // Chỉ redirect nếu không đang ở trang auth
  if (!window.location.pathname.startsWith('/login') &&
    !window.location.pathname.startsWith('/register')) {
    window.location.href = '/login';
  }
};

/**
 * Kiểm tra xem endpoint có phải là auth endpoint không
 * @param {string} url
 * @returns {boolean}
 */
const isAuthEndpoint = (url) => {
  return AUTH_ENDPOINTS.some(endpoint => url?.includes(endpoint));
};

// =============================================================================
// AXIOS INSTANCE
// =============================================================================

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================================
// REQUEST INTERCEPTOR
// =============================================================================

axiosClient.interceptors.request.use(
  (config) => {
    // Attach token nếu có
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log trong development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// =============================================================================
// RESPONSE INTERCEPTOR
// =============================================================================

// Flag để tránh multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

/**
 * Xử lý queue các requests đang chờ refresh token
 * @param {Error|null} error
 * @param {string|null} token
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  // SUCCESS HANDLER
  (response) => {
    // Trả về response. data để không cần . data ở nơi gọi
    return response?.data ?? response;
  },

  // ERROR HANDLER
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Log error trong development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ [${status}] ${originalRequest?.url}: `, error.response?.data);
    }

    // Xử lý 401 - Unauthorized
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {

      // Nếu đang refresh, thêm request vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Gọi API refresh token (dùng axios thuần để tránh interceptor loop)
        const response = await axios.post(`${API_BASE_URL}/auth/refreshtoken`, {
          refreshToken
        });

        const newAccessToken = response.data?.data?.accessToken;

        if (!newAccessToken) {
          throw new Error('Invalid refresh token response');
        }

        // Lưu token mới
        setAccessToken(newAccessToken);

        // Cập nhật header cho request gốc
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Xử lý các requests đang chờ
        processQueue(null, newAccessToken);

        return axiosClient(originalRequest);

      } catch (refreshError) {
        console.error('🔐 Token refresh failed:', refreshError);

        // Xử lý queue với error
        processQueue(refreshError, null);

        // Clear auth và redirect
        clearAuthAndRedirect();

        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    // Xử lý các lỗi khác
    return Promise.reject(error);
  }
);

// =============================================================================
// EXPORT
// =============================================================================

export default axiosClient;

// Export helpers nếu cần dùng ở nơi khác
export {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearAuthAndRedirect,
  STORAGE_KEYS
};