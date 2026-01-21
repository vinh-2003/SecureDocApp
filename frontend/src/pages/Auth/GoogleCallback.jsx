import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

// Components
import { AuthLayout, VerifyingState } from '../../components/Auth';

/**
 * Trang xử lý callback từ Google OAuth
 */
const GoogleCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const error = searchParams.get('error');

        if (error) {
            toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
            navigate('/login');
            return;
        }

        // Nếu không có lỗi, backend đã xử lý và redirect về dashboard
        // hoặc có thể xử lý token ở đây nếu cần

    }, [searchParams, navigate]);

    return (
        <AuthLayout>
            <VerifyingState message="Đang xử lý đăng nhập..." />
        </AuthLayout>
    );
};

export default GoogleCallback;