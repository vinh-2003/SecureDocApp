import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * =============================================================================
 * AXIOS CLIENT (REACT NATIVE VERSION)
 * =============================================================================
 * HTTP Client cấu hình cho Mobile:
 * - Sử dụng AsyncStorage thay cho localStorage
 * - Xử lý IP Address cho thiết bị thật/máy ảo
 * - Auto attach & refresh token
 * =============================================================================
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

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
// HELPER FUNCTIONS (ASYNCHRONOUS)
// =============================================================================

/**
 * Lấy access token từ AsyncStorage
 */
const getAccessToken = async () => {
    try {
        return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
        return null;
    }
};

/**
 * Lấy refresh token từ AsyncStorage
 */
const getRefreshToken = async () => {
    try {
        return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
        return null;
    }
};

/**
 * Lưu access token vào AsyncStorage
 */
const setAccessToken = async (token) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
        console.error('Error saving access token', error);
    }
};

/**
 * Xóa auth data (Logout)
 * Lưu ý: Việc điều hướng về Login sẽ do AuthContext thực hiện 
 * khi phát hiện state user bị null hoặc thông qua Event Emitter
 */
const clearAuth = async () => {
    try {
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.ACCESS_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER
        ]);
    } catch (error) {
        console.error('Error clearing auth data', error);
    }
};

/**
 * Kiểm tra xem endpoint có phải là auth endpoint không
 */
const isAuthEndpoint = (url) => {
    return AUTH_ENDPOINTS.some(endpoint => url?.includes(endpoint));
};

// =============================================================================
// AXIOS INSTANCE
// =============================================================================

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// =============================================================================
// REQUEST INTERCEPTOR
// =============================================================================

axiosClient.interceptors.request.use(
    async (config) => {
        // Attach token nếu có (phải dùng await)
        const token = await getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log trong development để debug dễ hơn trên Mobile
        if (__DEV__) {
            // console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`);
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

let isRefreshing = false;
let failedQueue = [];

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
    (response) => {
        return response?.data ?? response;
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // Log error
        if (__DEV__ && status) {
            console.error(`❌ [${status}] ${originalRequest?.url}: `, error.response?.data?.message || 'Error');
        }

        // Xử lý 401 - Unauthorized
        if (status === 401 && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {

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
                const refreshToken = await getRefreshToken();

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Gọi API refresh token (dùng axios thuần)
                // Lưu ý: Phải truyền đúng full URL vì axios thuần không có baseURL
                const response = await axios.post(`${API_BASE_URL}/auth/refreshtoken`, {
                    refreshToken
                });

                const newAccessToken = response.data?.data?.accessToken;

                if (!newAccessToken) {
                    throw new Error('Invalid refresh token response');
                }

                await setAccessToken(newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                processQueue(null, newAccessToken);

                return axiosClient(originalRequest);

            } catch (refreshError) {
                console.error('🔐 Token refresh failed:', refreshError);
                processQueue(refreshError, null);

                // Xóa token để AuthContext nhận biết và logout
                await clearAuth();

                return Promise.reject(refreshError);

            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// =============================================================================
// EXPORT
// =============================================================================

export default axiosClient;

export {
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    clearAuth,
    STORAGE_KEYS
};