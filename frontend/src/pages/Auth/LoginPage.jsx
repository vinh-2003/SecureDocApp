import React from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';

// Components
import {
    AuthLayout,
    AuthInput,
    AuthButton,
    AuthDivider,
    AuthFooter,
    GoogleLoginButton
} from '../../components/Auth';

// Hooks
import { useLogin } from '../../hooks';

/**
 * =============================================================================
 * LOGIN PAGE
 * =============================================================================
 * Trang đăng nhập với: 
 * - Form đăng nhập username/password
 * - Đăng nhập bằng Google
 * - Link quên mật khẩu
 * - Link đăng ký
 * =============================================================================
 */
const LoginPage = () => {
    const { form, loading, handleLogin, handleGoogleLogin } = useLogin();
    const { register, handleSubmit, formState: { errors } } = form;

    return (
        <AuthLayout
            title="Chào mừng trở lại"
            subtitle="Đăng nhập để tiếp tục sử dụng SecureDoc"
        >
            {/* Login Form */}
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
                {/* Tên đăng nhập */}
                <AuthInput
                    label="Tên đăng nhập"
                    placeholder="Nhập tên đăng nhập"
                    icon={FaUser}
                    error={errors.username?.message}
                    register={register('username', {
                        required: 'Vui lòng nhập tên đăng nhập'
                    })}
                />

                {/* Mật khẩu */}
                <AuthInput
                    label="Mật khẩu"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    icon={FaLock}
                    error={errors.password?.message}
                    register={register('password', {
                        required: 'Vui lòng nhập mật khẩu'
                    })}
                    rightElement={
                        <Link
                            to="/forgot-password"
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition"
                        >
                            Quên mật khẩu?
                        </Link>
                    }
                />

                {/* Nút đăng nhập */}
                <AuthButton loading={loading}>
                    <FaSignInAlt />
                    <span>Đăng nhập</span>
                </AuthButton>
            </form>

            {/* Divider */}
            <AuthDivider text="hoặc tiếp tục với" />

            {/* Google Login */}
            <GoogleLoginButton
                onSuccess={handleGoogleLogin}
            />

            {/* Footer */}
            <AuthFooter
                text="Chưa có tài khoản?"
                linkText="Đăng ký ngay"
                linkTo="/register"
            />
        </AuthLayout>
    );
};

export default LoginPage;