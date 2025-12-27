import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { toast } from 'react-toastify';

import Loading from '../components/Loading';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        navigate('/'); // Chuyển về trang chủ
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  // Hàm xử lý Google Login
  const loginWithGoogle = async (credentialResponse) => {
    try {
        if(credentialResponse.credential) {
            const res = await authService.googleLogin(credentialResponse.credential);
            if (res.success) {
                const { accessToken, refreshToken, ...userInfo } = res.data;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user', JSON.stringify(userInfo));
                setUser(userInfo);
                toast.success('Đăng nhập Google thành công!');
                navigate('/');
            }
        }
    } catch (error) {
        toast.error('Lỗi đăng nhập Google');
    }
  }

  const logout = () => {
    authService.logout().then(() => {
        localStorage.clear();
        setUser(null);
        navigate('/login');
    });
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
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, updateUser, loading }}>
      {/* Nếu đang loading khởi tạo thì hiện màn hình chờ Fullscreen */}
      {loading ? <Loading fullScreen={true} text="Đang khởi động hệ thống..." /> : children}
    </AuthContext.Provider>
  );
};