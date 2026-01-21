import React from 'react';
import { Spinner } from '../Common/Loading';

/**
 * Button cho các form Auth
 */
const AuthButton = ({
    children,
    type = 'submit',
    loading = false,
    disabled = false,
    variant = 'primary',
    fullWidth = true,
    onClick,
    ...props
}) => {
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40',
        success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        outline: 'border-2 border-gray-200 hover:border-gray-300 text-gray-700 bg-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30'
    };

    return (
        <button
            type={type}
            disabled={loading || disabled}
            onClick={onClick}
            className={`
                ${fullWidth ? 'w-full' : ''}
                py-3 px-6 rounded-xl font-medium text-sm
                transition-all duration-200 transform
                flex items-center justify-center gap-2
                disabled:opacity-60 disabled:cursor-not-allowed
                active:scale-[0.98]
                ${variants[variant]}
            `}
            {...props}
        >
            {loading ? (
                <>
                    <Spinner size="sm" color="white" />
                    <span>Đang xử lý... </span>
                </>
            ) : (
                children
            )}
        </button>
    );
};

export default AuthButton;