// src/hooks/useLogin.js
import { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';

const useLogin = () => {
    const { login, loginWithGoogle } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    // [SỬA 1] Destructuring lấy đúng control và handleSubmit ra
    const { control, handleSubmit } = useForm({
        defaultValues: {
            username: '',
            password: ''
        }
    });

    const handleLogin = async (data) => {
        setLoading(true);
        try {
            await login(data.username, data.password);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await loginWithGoogle();
        } finally {
            setLoading(false);
        }
    };

    return {
        control,      // [SỬA 2] Trả về đúng object control
        handleSubmit, // [SỬA 3] Trả về hàm handleSubmit riêng
        loading,
        handleLogin,
        handleGoogleLogin
    };
};

export default useLogin;