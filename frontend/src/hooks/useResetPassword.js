import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';

// Regex cho ký tự đặc biệt
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,. <>/?]/;

/**
 * Hook quản lý logic đặt lại mật khẩu
 */
const useResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState(true);

    const form = useForm({
        defaultValues: {
            newPassword: '',
            confirmPassword: ''
        },
        mode: 'onChange'
    });

    const { watch } = form;
    const newPassword = watch('newPassword');

    // Kiểm tra token
    useEffect(() => {
        if (!token) {
            setIsValidToken(false);
            toast.error('Link không hợp lệ hoặc đã hết hạn! ');

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }
    }, [token, navigate]);

    // Custom validate cho password
    const validatePassword = (value) => {
        if (!value) return 'Mật khẩu không được để trống';
        if (value.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
        if (!/[a-z]/.test(value)) return 'Mật khẩu phải có chữ cái thường (a-z)';
        if (!/[A-Z]/.test(value)) return 'Mật khẩu phải có chữ cái hoa (A-Z)';
        if (!/[0-9]/.test(value)) return 'Mật khẩu phải có chữ số (0-9)';
        if (!SPECIAL_CHAR_REGEX.test(value)) return 'Mật khẩu phải có ký tự đặc biệt (! @#$%...)';
        return true;
    };

    // Validation rules
    const validationRules = {
        newPassword: {
            required: 'Mật khẩu không được để trống',
            validate: validatePassword
        },
        confirmPassword: {
            required: 'Vui lòng xác nhận mật khẩu',
            validate: (value) => value === newPassword || 'Mật khẩu nhập lại không khớp'
        }
    };

    // Xử lý đặt lại mật khẩu
    const handleSubmit = useCallback(async (data) => {
        if (!token) return;

        setLoading(true);
        try {
            await authService.resetPassword(token, data.newPassword);

            setIsSuccess(true);
            toast.success('Đổi mật khẩu thành công!');

        } catch (error) {
            const message = error.response?.data?.message || 'Link đã hết hạn hoặc không hợp lệ. ';
            toast.error(message);

            // Nếu token hết hạn, chuyển về trang quên mật khẩu
            if (error.response?.status === 400 || error.response?.status === 401) {
                setTimeout(() => {
                    navigate('/forgot-password');
                }, 2000);
            }
        } finally {
            setLoading(false);
        }
    }, [token, navigate]);

    // Chuyển đến trang đăng nhập
    const goToLogin = useCallback(() => {
        navigate('/login');
    }, [navigate]);

    return {
        form,
        loading,
        isSuccess,
        isValidToken,
        token,
        newPassword,
        validationRules,
        handleSubmit,
        goToLogin
    };
};

export default useResetPassword;