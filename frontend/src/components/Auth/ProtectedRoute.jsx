import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Loading } from '../Common';

/**
 * =============================================================================
 * PROTECTED ROUTE
 * =============================================================================
 * Component bảo vệ các route yêu cầu đăng nhập
 * 
 * @param {string} redirectTo - Đường dẫn redirect khi chưa đăng nhập (default: '/login')
 * @param {ReactNode} children - Children thay thế Outlet (optional)
 * @param {Array<string>} requiredRoles - Danh sách roles được phép truy cập (optional)
 * =============================================================================
 */
const ProtectedRoute = ({
  redirectTo = '/login',
  children,
  requiredRoles = []
}) => {
  const { user, loading, isExplicitLogout } = useContext(AuthContext);
  const location = useLocation();

  // 1. Đang tải thông tin user → Hiện loading
  if (loading) {
    return (
      <Loading
        variant="fullscreen"
        text="Đang xác thực..."
      />
    );
  }

  // 2. Chưa đăng nhập → Redirect về login (lưu lại URL hiện tại)
  if (!user) {
    if (isExplicitLogout) {
        return <Navigate to={redirectTo} replace />;
    }
    
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // 3. Kiểm tra role (nếu có yêu cầu)
  if (requiredRoles.length > 0) {
    const userRoles = user.roles || [];
    const hasRequiredRole = requiredRoles.some(role =>
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      // Không có quyền → Redirect về trang chủ hoặc trang 403
      return (
        <Navigate
          to="/"
          state={{ error: 'Bạn không có quyền truy cập trang này' }}
          replace
        />
      );
    }
  }

  // 4. Đã đăng nhập và có quyền → Render content
  return children ? children : <Outlet />;
};

export default ProtectedRoute;