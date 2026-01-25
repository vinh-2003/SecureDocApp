import React, { createContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { toast } from 'react-toastify';

import { Loading } from '../components/Common';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  const [isExplicitLogout, setIsExplicitLogout] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Khôi phục user khi reload trang (nếu còn token)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Hàm xử lý Login
  const login = async (username, password) => {
    // Reset cờ logout để đảm bảo logic redirect hoạt động đúng cho lần sau
    setIsExplicitLogout(false);

    try {
      const res = await authService.login(username, password);
      // Backend trả về: { success: true, data: { accessToken, user... } }
      if (res.success) {
        const { accessToken, refreshToken, ...userInfo } = res.data;

        // Lưu vào LocalStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userInfo));

        setUser(userInfo);
        toast.success('Đăng nhập thành công!');

        const from = location.state?.from || '/';
        navigate(from, { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  // Hàm xử lý Google Login
  const loginWithGoogle = async (credentialResponse) => {
    setIsExplicitLogout(false);

    try {
      if (credentialResponse.credential) {
        const res = await authService.googleLogin(credentialResponse.credential);
        if (res.success) {
          const { accessToken, refreshToken, ...userInfo } = res.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(userInfo));
          setUser(userInfo);
          toast.success('Đăng nhập Google thành công!');

          const from = location.state?.from || '/';
          navigate(from, { replace: true });
        }
      }
    } catch (error) {
      toast.error('Lỗi đăng nhập Google');
    }
  }

  const logout = () => {
    authService.logout(); // Gọi API ngầm
    localStorage.clear();

    // B1: Bật cờ "Tôi đang chủ động đăng xuất"
    // Việc này báo hiệu cho ProtectedRoute biết đừng có lưu lại URL hiện tại
    setIsExplicitLogout(true);

    // B2: Xóa user
    setUser(null);

    // B3: Về trang login
    navigate('/login', { replace: true });
  };

  // --- THÊM HÀM CẬP NHẬT STATE USER ---
  const updateUser = (updatedData) => {
    setUser((prevUser) => {
      // 1. Gộp thông tin cũ và thông tin mới
      const newUser = { ...prevUser, ...updatedData };

      // 2. LƯU NGAY VÀO LOCAL STORAGE
      // Quan trọng: Key phải trùng với key bạn dùng lúc login ('user')
      localStorage.setItem('user', JSON.stringify(newUser));

      // 3. Trả về state mới để React render lại giao diện
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, updateUser, loading, isExplicitLogout }}>
      {/* Nếu đang loading khởi tạo thì hiện màn hình chờ Fullscreen */}
      {loading ? <Loading fullScreen={true} text="Đang khởi động hệ thống..." /> : children}
    </AuthContext.Provider>
  );
};