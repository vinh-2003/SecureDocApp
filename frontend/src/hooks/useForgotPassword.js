import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import authService from '../services/authService';

/**
 * Hook quản lý logic quên mật khẩu
 */
const useForgotPassword = () => {
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [sentEmail, setSentEmail] = useState('');

    const form = useForm({
        defaultValues: {
            email: ''
        },
        mode: 'onBlur'
    });

    // Validation rules
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
    const handleSubmit = useCallback(async (data) => {
        setLoading(true);
        try {
            await authService.forgotPassword(data.email);

            setEmailSent(true);
            setSentEmail(data.email);
            toast.success('Link đặt lại mật khẩu đã được gửi vào email của bạn! ');

        } catch (error) {
            const message = error.response?.data?.message || 'Không tìm thấy email này trong hệ thống. ';
            toast.error(message);
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
            toast.success('Đã gửi lại email! ');
        } catch (error) {
            toast.error('Không thể gửi lại email. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    }, [sentEmail]);

    // Reset form
    const handleReset = useCallback(() => {
        setEmailSent(false);
        setSentEmail('');
        form.reset();
    }, [form]);

    return {
        form,
        loading,
        emailSent,
        sentEmail,
        validationRules,
        handleSubmit,
        handleResend,
        handleReset
    };
};

export default useForgotPassword;