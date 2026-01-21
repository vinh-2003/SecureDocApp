import React from 'react';
import { AppLogo } from '../Common';

/**
 * Layout chung cho các trang Auth (Login, Register, Forgot Password...)
 */
const AuthLayout = ({
    children,
    title,
    subtitle,
    showLogo = true
}) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-50 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full opacity-50 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                {showLogo && (
                    <div className="text-center mb-8">
                        <AppLogo size="lg" linkTo="/" />
                    </div>
                )}

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    {(title || subtitle) && (
                        <div className="px-8 pt-8 pb-4 text-center">
                            {title && (
                                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p className="text-gray-500 text-sm">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="px-8 pb-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;