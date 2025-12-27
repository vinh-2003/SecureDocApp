import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Loading from './Loading';

const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  // 1. Đang tải thông tin user -> Hiện màn hình chờ
  if (loading) {
    return <Loading fullScreen={true} />;
  }

  // 2. Nếu đã tải xong mà không có user -> Đuổi về Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Có user -> Cho phép hiển thị nội dung bên trong (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;