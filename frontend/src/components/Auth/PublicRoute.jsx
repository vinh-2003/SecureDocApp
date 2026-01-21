import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Loading } from '../Common';

/**
 * =============================================================================
 * PUBLIC ROUTE
 * =============================================================================
 * Route chỉ dành cho user CHƯA đăng nhập (Login, Register, etc.)
 * Nếu đã đăng nhập → Redirect về trang chính
 * 
 * @param {string} redirectTo - Đường dẫn redirect khi đã đăng nhập (default: '/')
 * @param {ReactNode} children - Children thay thế Outlet (optional)
 * =============================================================================
 */
const PublicRoute = ({
    redirectTo = '/',
    children
}) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    // Đang tải
    if (loading) {
        return (
            <Loading
                variant="fullscreen"
                text="Đang kiểm tra..."
            />
        );
    }

    // Đã đăng nhập → Redirect về trang đã lưu hoặc trang chủ
    if (user) {
        const from = location.state?.from || redirectTo;
        return <Navigate to={from} replace />;
    }

    // Chưa đăng nhập → Cho phép truy cập
    return children ? children : <Outlet />;
};

export default PublicRoute;