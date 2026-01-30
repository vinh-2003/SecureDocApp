import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import authService from '../services/authService';

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

const useRegister = (navigation) => {
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, watch, setError } = useForm({
        defaultValues: {
            fullName: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        },
        mode: 'onChange' // Validate realtime
    });

    const password = watch('password');

    // Validation Rules (Giống hệt Web)
    const validationRules = {
        fullName: {
            required: 'Họ tên không được để trống',
            minLength: { value: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
            maxLength: { value: 100, message: 'Họ tên không được quá 100 ký tự' }
        },
        username: {
            required: 'Tên đăng nhập không được để trống',
            minLength: { value: 4, message: 'Tên đăng nhập phải từ 4 ký tự trở lên' },
            maxLength: { value: 50, message: 'Tên đăng nhập không được quá 50 ký tự' },
            pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: 'Tên đăng nhập chỉ chứa chữ cái, số và gạch dưới'
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
            validate: (value) => {
                if (value.length < 8) return 'Mật khẩu quá ngắn';
                // Các rule khác đã được check realtime ở UI PasswordRequirements
                // Nhưng ta vẫn nên giữ chặn cuối ở đây để an toàn
                if (!/[a-z]/.test(value)) return 'Thiếu chữ thường';
                if (!/[A-Z]/.test(value)) return 'Thiếu chữ hoa';
                if (!/[0-9]/.test(value)) return 'Thiếu số';
                if (!SPECIAL_CHAR_REGEX.test(value)) return 'Thiếu ký tự đặc biệt';
                return true;
            }
        },
        confirmPassword: {
            required: 'Vui lòng xác nhận mật khẩu',
            validate: (value) => value === password || 'Mật khẩu nhập lại không khớp'
        }
    };

    const handleRegister = async (data) => {
        setLoading(true);
        try {
            const { confirmPassword, ...registerData } = data;
            const res = await authService.register(registerData);

            if (res.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Đăng ký thành công',
                    text2: 'Vui lòng kiểm tra email để kích hoạt.'
                });
                // Delay một chút để user đọc thông báo
                setTimeout(() => navigation.navigate('Login'), 1500);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Đăng ký thất bại';
            Toast.show({ type: 'error', text1: 'Lỗi', text2: msg });
        } finally {
            setLoading(false);
        }
    };

    return {
        control,
        handleSubmit,
        loading,
        handleRegister,
        password,
        validationRules // Export rule để dùng ở màn hình
    };
};

export default useRegister;