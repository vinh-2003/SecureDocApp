import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message'; // [Mobile] Thay react-toastify
import authService from '../services/authService';

const useForgotPassword = () => {
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [sentEmail, setSentEmail] = useState('');

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            email: ''
        },
        mode: 'onBlur'
    });

    // Validation rules (Giữ nguyên Regex từ Web)
    const validationRules = {
        email: {
            required: 'Vui lòng nhập email',
            pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email không hợp lệ'
            }
        }
    };

    // Xử lý gửi email
    const handleSendEmail = useCallback(async (data) => {
        setLoading(true);
        try {
            await authService.forgotPassword(data.email);

            setEmailSent(true);
            setSentEmail(data.email);

            Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Link đặt lại mật khẩu đã được gửi!'
            });

        } catch (error) {
            const message = error.response?.data?.message || 'Không tìm thấy email này trong hệ thống.';
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: message
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Gửi lại email
    const handleResend = useCallback(async () => {
        if (!sentEmail) return;

        setLoading(true);
        try {
            await authService.forgotPassword(sentEmail);
            Toast.show({
                type: 'success',
                text1: 'Đã gửi lại email!'
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Thất bại',
                text2: 'Không thể gửi lại email. Vui lòng thử lại sau.'
            });
        } finally {
            setLoading(false);
        }
    }, [sentEmail]);

    // Reset form để nhập email khác
    const handleReset = useCallback(() => {
        setEmailSent(false);
        setSentEmail('');
        reset();
    }, [reset]);

    return {
        control,
        handleSubmit,
        loading,
        emailSent,
        sentEmail,
        validationRules,
        handleSendEmail,
        handleResend,
        handleReset
    };
};

export default useForgotPassword;