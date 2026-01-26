import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import userService from '../services/userService';

// Regex đồng bộ với PasswordRequirements
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/? ]/;

const useChangePassword = (onClose, onSuccess) => {
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({ mode: 'onChange' });

    // Quản lý trạng thái hiển thị của từng ô input
    const [visibility, setVisibility] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Lấy giá trị mật khẩu mới để so sánh và hiển thị requirements
    const newPasswordValue = watch('newPassword');

    // Hàm toggle ẩn/hiện
    const toggleVisibility = (field) => {
        setVisibility(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // Rules validation
    const validationRules = {
        currentPassword: {
            required: 'Vui lòng nhập mật khẩu hiện tại'
        },
        newPassword: {
            required: 'Vui lòng nhập mật khẩu mới',
            minLength: {
                value: 8,
                message: 'Mật khẩu phải có ít nhất 8 ký tự'
            },
            validate: {
                hasLowercase: (v) => /[a-z]/.test(v) || 'Thiếu chữ thường (a-z)',
                hasUppercase: (v) => /[A-Z]/.test(v) || 'Thiếu chữ hoa (A-Z)',
                hasNumber: (v) => /[0-9]/.test(v) || 'Thiếu số (0-9)',
                hasSpecial: (v) => SPECIAL_CHAR_REGEX.test(v) || 'Thiếu ký tự đặc biệt'
            }
        },
        confirmPassword: {
            required: 'Vui lòng xác nhận mật khẩu',
            validate: (val) => val === newPasswordValue || 'Mật khẩu xác nhận không khớp'
        }
    };

    // Xử lý Submit
    const onSubmit = async (data) => {
        try {
            const res = await userService.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });

            if (res.success) {
                toast.success('Đổi mật khẩu thành công!');
                reset();
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.';
            toast.error(message);
        }
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isSubmitting,
        visibility,
        toggleVisibility,
        newPasswordValue,
        validationRules
    };
};

export default useChangePassword;