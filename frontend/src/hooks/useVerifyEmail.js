import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * Các trạng thái của quá trình xác thực
 */
export const VERIFY_STATUS = {
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
};

/**
 * Hook quản lý logic xác thực email
 */
const useVerifyEmail = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState(VERIFY_STATUS.LOADING);
    const [message, setMessage] = useState('Đang xác thực tài khoản của bạn...');
    const [countdown, setCountdown] = useState(5);

    // Đảm bảo API chỉ gọi 1 lần (tránh StrictMode gọi 2 lần)
    const verifyCalled = useRef(false);

    // Xác thực token
    useEffect(() => {
        // Không có token
        if (!token) {
            setStatus(VERIFY_STATUS.ERROR);
            setMessage('Đường dẫn xác thực không hợp lệ.');
            return;
        }

        // Đã gọi rồi thì không gọi lại
        if (verifyCalled.current) return;
        verifyCalled.current = true;

        const verifyToken = async () => {
            try {
                await authService.verifyAccount(token);

                setStatus(VERIFY_STATUS.SUCCESS);
                setMessage('Kích hoạt tài khoản thành công!  Bạn có thể đăng nhập ngay bây giờ.');

            } catch (error) {
                setStatus(VERIFY_STATUS.ERROR);
                setMessage(
                    error.response?.data?.message ||
                    'Xác thực thất bại.  Link có thể đã hết hạn hoặc không hợp lệ.'
                );
            }
        };

        verifyToken();
    }, [token]);

    // Countdown và tự động chuyển trang khi thành công
    useEffect(() => {
        if (status !== VERIFY_STATUS.SUCCESS) return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/login');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status, navigate]);

    // Chuyển đến trang đăng nhập
    const goToLogin = useCallback(() => {
        navigate('/login');
    }, [navigate]);

    // Yêu cầu gửi lại email xác thực
    const requestResend = useCallback(() => {
        navigate('/resend-verification');
    }, [navigate]);

    return {
        status,
        message,
        countdown,
        goToLogin,
        requestResend
    };
};

export default useVerifyEmail;