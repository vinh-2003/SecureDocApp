import React from 'react';
import { FaExclamationTriangle, FaRedo, FaImage } from 'react-icons/fa';

// Components
import { Spinner } from '../Common/Loading';

// Hooks
import { useSecureImage } from '../../hooks';

/**
 * =============================================================================
 * SECURE IMAGE
 * =============================================================================
 * Component hiển thị ảnh bảo mật được tải từ API
 * 
 * @param {string} pageId - ID của trang cần hiển thị
 * @param {string} className - CSS classes
 * @param {string} alt - Alt text cho ảnh
 * @param {boolean} showRetry - Hiển thị nút retry khi lỗi
 * @param {Function} onLoad - Callback khi ảnh load xong
 * @param {Function} onError - Callback khi có lỗi
 * =============================================================================
 */
const SecureImage = ({
    pageId,
    className = '',
    alt = 'Secure image',
    showRetry = true,
    onLoad,
    onError
}) => {
    const { imageUrl, loading, error, refetch } = useSecureImage(pageId);

    // Callback khi ảnh load xong
    const handleImageLoad = () => {
        onLoad?.();
    };

    // Callback khi có lỗi
    React.useEffect(() => {
        if (error) {
            onError?.(error);
        }
    }, [error, onError]);

    // Loading state
    if (loading) {
        return <LoadingPlaceholder className={className} />;
    }

    // Error state
    if (error) {
        return (
            <ErrorPlaceholder
                className={className}
                showRetry={showRetry}
                onRetry={refetch}
            />
        );
    }

    // No image state
    if (!imageUrl) {
        return <EmptyPlaceholder className={className} />;
    }

    // Success - render image
    return (
        <img
            src={imageUrl}
            alt={alt}
            className={className}
            onLoad={handleImageLoad}
            draggable={false}
        />
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Loading placeholder
 */
const LoadingPlaceholder = ({ className }) => (
    <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        role="status"
        aria-label="Đang tải ảnh"
    >
        <Spinner size="md" color="blue" />
    </div>
);

/**
 * Error placeholder
 */
const ErrorPlaceholder = ({ className, showRetry, onRetry }) => (
    <div
        className={`flex flex-col items-center justify-center bg-gray-100 gap-2 ${className}`}
        role="alert"
    >
        <FaExclamationTriangle className="text-red-400" size={24} />
        <span className="text-xs text-red-500 text-center px-2">
            Lỗi tải ảnh
        </span>
        {showRetry && (
            <button
                onClick={onRetry}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition mt-1"
                title="Thử tải lại"
            >
                <FaRedo size={10} />
                Thử lại
            </button>
        )}
    </div>
);

/**
 * Empty placeholder
 */
const EmptyPlaceholder = ({ className }) => (
    <div
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}
    >
        <FaImage size={24} />
        <span className="text-xs mt-1">Không có ảnh</span>
    </div>
);

export default SecureImage;
export { LoadingPlaceholder, ErrorPlaceholder, EmptyPlaceholder };