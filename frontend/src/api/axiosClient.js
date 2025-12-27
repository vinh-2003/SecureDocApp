import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 1. REQUEST INTERCEPTOR ---
// Gắn Access Token vào mọi request
axiosClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- 2. RESPONSE INTERCEPTOR (Xử lý Refresh Token) ---
axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi là 401 (Unauthorized) và chưa từng thử refresh trước đó
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      // Tránh lặp vô hạn nếu chính API login hoặc refresh token bị lỗi
      originalRequest.url !== '/auth/signin' &&
      originalRequest.url !== '/auth/refreshtoken'
    ) {
      originalRequest._retry = true; // Đánh dấu đã thử refresh

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        // Gọi API làm mới token (Dùng instance axios mới để tránh lặp interceptor)
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/refreshtoken`, {
          refreshToken: refreshToken
        });

        // Backend trả về: { success: true, data: { accessToken: "...", refreshToken: "..." } }
        // Lưu ý: Cấu trúc res phụ thuộc vào ApiResponse của bạn
        // Vì ta dùng axios thường (không qua axiosClient), nên res chứa toàn bộ response object
        const newAccessToken = res.data.data.accessToken;

        // 1. Lưu token mới vào Storage
        localStorage.setItem('accessToken', newAccessToken);
        
        // 2. Cập nhật header cho request đang bị lỗi
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // 3. Gọi lại request ban đầu với token mới
        return axiosClient(originalRequest);

      } catch (refreshError) {
        // Nếu refresh cũng lỗi (hết hạn, hoặc không hợp lệ) -> Logout
        console.error("Refresh token failed:", refreshError);
        localStorage.clear();
        window.location.href = '/login'; // Chuyển hướng cứng về trang login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;