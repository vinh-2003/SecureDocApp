import { lazy } from 'react';

// Lazy load các trang Auth
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/Auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('../pages/Auth/VerifyEmailPage'));
const GoogleCallback = lazy(() => import('../pages/Auth/GoogleCallback'));

/**
 * Các routes công khai (không cần đăng nhập)
 */
const publicRoutes = [
    {
        path: '/login',
        element: LoginPage
    },
    {
        path: '/register',
        element: RegisterPage
    },
    {
        path: '/forgot-password',
        element: ForgotPasswordPage
    },
    {
        path: '/reset-password',
        element: ResetPasswordPage
    },
    {
        path: '/verify-email',
        element: VerifyEmailPage
    },
    {
        path: '/auth/google/callback',
        element: GoogleCallback
    }
];

export default publicRoutes;