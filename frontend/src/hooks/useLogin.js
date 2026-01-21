import { useState, useContext, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook quản lý logic đăng nhập
 */
const useLogin = () => {
    const { login, loginWithGoogle } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    const form = useForm({
        defaultValues: {
            username: '',
            password: ''
        }
    });

    // Xử lý đăng nhập
    const handleLogin = useCallback(async (data) => {
        setLoading(true);
        try {
            await login(data.username, data.password);
        } finally {
            setLoading(false);
        }
    }, [login]);

    // Xử lý đăng nhập Google
    const handleGoogleLogin = useCallback(async (credentialResponse) => {
        setLoading(true);
        try {
            await loginWithGoogle(credentialResponse);
        } finally {
            setLoading(false);
        }
    }, [loginWithGoogle]);

    return {
        form,
        loading,
        handleLogin,
        handleGoogleLogin
    };
};

export default useLogin;