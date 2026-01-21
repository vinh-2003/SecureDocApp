import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt } from 'react-icons/fa';

/**
 * =============================================================================
 * APP LOGO
 * =============================================================================
 * Component logo ứng dụng dùng chung
 * 
 * @param {string} size - Kích thước:  'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} showText - Hiển thị tên ứng dụng
 * @param {boolean} linkTo - Đường dẫn khi click (null = không link)
 * @param {string} variant - Kiểu hiển thị: 'default' | 'light' | 'dark'
 * @param {string} className - CSS classes bổ sung
 * =============================================================================
 */
const AppLogo = ({
    size = 'md',
    showText = true,
    linkTo = '/',
    variant = 'default',
    className = ''
}) => {
    // Size configurations
    const sizes = {
        sm: {
            icon: 16,
            iconWrapper: 'p-1.5',
            text: 'text-lg',
            gap: 'gap-1. 5'
        },
        md: {
            icon: 20,
            iconWrapper: 'p-2',
            text: 'text-xl',
            gap: 'gap-2'
        },
        lg: {
            icon: 24,
            iconWrapper: 'p-2.5',
            text: 'text-2xl',
            gap: 'gap-2'
        },
        xl: {
            icon: 32,
            iconWrapper: 'p-3',
            text: 'text-3xl',
            gap: 'gap-3'
        }
    };

    // Variant configurations
    const variants = {
        default: {
            iconBg: 'bg-blue-600',
            iconColor: 'text-white',
            textPrimary: 'text-gray-800',
            textAccent: 'text-blue-600'
        },
        light: {
            iconBg: 'bg-white/20',
            iconColor: 'text-white',
            textPrimary: 'text-white',
            textAccent: 'text-blue-200'
        },
        dark: {
            iconBg: 'bg-blue-600',
            iconColor: 'text-white',
            textPrimary: 'text-white',
            textAccent: 'text-blue-600'
        }
    };

    const currentSize = sizes[size] || sizes.md;
    const currentVariant = variants[variant] || variants.default;

    const LogoContent = () => (
        <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
            {/* Icon */}
            <div className={`
                ${currentSize.iconWrapper} 
                ${currentVariant.iconBg} 
                rounded-xl shadow-lg
                transition-transform duration-200
                group-hover:scale-105 group-hover:shadow-xl
            `}>
                <FaShieldAlt
                    className={currentVariant.iconColor}
                    size={currentSize.icon}
                />
            </div>

            {/* Text */}
            {showText && (
                <span className={`font-bold ${currentSize.text}`}>
                    <span className={currentVariant.textPrimary}>Secure</span>
                    <span className={currentVariant.textAccent}>Doc</span>
                </span>
            )}
        </div>
    );

    // Nếu có link
    if (linkTo) {
        return (
            <Link to={linkTo} className="group inline-flex">
                <LogoContent />
            </Link>
        );
    }

    // Không có link
    return <LogoContent />;
};

/**
 * App name constant - Dùng ở các nơi khác nếu cần
 */
export const APP_NAME = 'SecureDoc';
export const APP_DESCRIPTION = 'Quản lý tài liệu an toàn';

export default AppLogo;