import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';

// Regex cho ký tự đặc biệt
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

/**
 * Hook quản lý logic đăng ký tài khoản
 */
const useRegister = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        defaultValues: {
            fullName: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        },
        mode: 'onChange'
    });

    const { watch } = form;
    const password = watch('password');

    // Custom validate cho password - YÊU CẦU TẤT CẢ ĐIỀU KIỆN
    const validatePassword = (value) => {
        if (!value) return 'Mật khẩu không được để trống';
        if (value.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
        if (!/[a-z]/.test(value)) return 'Mật khẩu phải có chữ cái thường (a-z)';
        if (!/[A-Z]/.test(value)) return 'Mật khẩu phải có chữ cái hoa (A-Z)';
        if (!/[0-9]/.test(value)) return 'Mật khẩu phải có chữ số (0-9)';
        if (!SPECIAL_CHAR_REGEX.test(value)) return 'Mật khẩu phải có ký tự đặc biệt (!@#$%...)';
        return true;
    };

    // Validation rules
    const validationRules = {
        fullName: {
            required: 'Họ tên không được để trống',
            minLength: {
                value: 2,
                message: 'Họ tên phải có ít nhất 2 ký tự'
            },
            maxLength: {
                value: 100,
                message: 'Họ tên không được quá 100 ký tự'
            }
        },
        username: {
            required: 'Tên đăng nhập không được để trống',
            minLength: {
                value: 4,
                message: 'Tên đăng nhập phải từ 4 ký tự trở lên'
            },
            maxLength: {
                value: 50,
                message: 'Tên đăng nhập không được quá 50 ký tự'
            },
            pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'
            }
        },
        email: {
            required: 'Email không được để trống',
            pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email không hợp lệ'
            }
        },
        password: {
            required: 'Mật khẩu không được để trống',
            validate: validatePassword
        },
        confirmPassword: {
            required: 'Vui lòng xác nhận mật khẩu',
            validate: (value) => value === password || 'Mật khẩu nhập lại không khớp'
        }
    };

    // Xử lý đăng ký
    const handleRegister = useCallback(async (data) => {
        setLoading(true);
        try {
            const { confirmPassword, ...registerData } = data;

            await authService.register(registerData);

            toast.success('Đăng ký thành công!  Vui lòng kiểm tra email để kích hoạt tài khoản.');

            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    return {
        form,
        loading,
        validationRules,
        handleRegister
    };
};

export default useRegister;