import React from 'react';
import { FaExclamationTriangle, FaQuestionCircle, FaCheckCircle } from 'react-icons/fa';

/**
 * Các loại variant của modal
 */
export const MODAL_VARIANTS = {
    DANGER: 'danger',
    WARNING: 'warning',
    INFO: 'info',
    SUCCESS: 'success'
};

/**
 * Config cho từng variant
 */
const VARIANT_CONFIG = {
    [MODAL_VARIANTS.DANGER]: {
        icon: FaExclamationTriangle,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    [MODAL_VARIANTS.WARNING]: {
        icon: FaExclamationTriangle,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    [MODAL_VARIANTS.INFO]: {
        icon: FaQuestionCircle,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    },
    [MODAL_VARIANTS.SUCCESS]: {
        icon: FaCheckCircle,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        buttonBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    }
};

/**
 * Component Loading Spinner
 */
const LoadingSpinner = () => (
    <svg
        className="animate-spin h-4 w-4 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
);

/**
 * Modal xác nhận hành động
 * 
 * @param {boolean} isOpen - Trạng thái mở/đóng
 * @param {Function} onClose - Callback đóng modal
 * @param {Function} onConfirm - Callback xác nhận
 * @param {string} title - Tiêu đề modal
 * @param {string|ReactNode} message - Nội dung thông báo
 * @param {boolean} isLoading - Đang xử lý
 * @param {string} confirmText - Text nút xác nhận
 * @param {string} cancelText - Text nút hủy
 * @param {string} variant - Loại modal:  'danger' | 'warning' | 'info' | 'success'
 * @param {boolean} isDanger - Deprecated:  Dùng variant="danger" thay thế
 * @param {boolean} showIcon - Hiển thị icon không
 * @param {boolean} closeOnOverlay - Đóng khi click overlay
 */
const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Xác nhận hành động",
    message = "Bạn có chắc chắn muốn thực hiện hành động này không?",
    isLoading = false,
    confirmText = "Xác nhận",
    cancelText = "Hủy bỏ",
    variant,
    isDanger = false, // Backward compatibility
    showIcon = true,
    closeOnOverlay = true
}) => {
    // Xác định variant (backward compatible với isDanger)
    const activeVariant = variant || (isDanger ? MODAL_VARIANTS.DANGER : MODAL_VARIANTS.INFO);
    const config = VARIANT_CONFIG[activeVariant] || VARIANT_CONFIG[MODAL_VARIANTS.INFO];
    const IconComponent = config.icon;

    // Xử lý click overlay
    const handleOverlayClick = (e) => {
        if (closeOnOverlay && e.target === e.currentTarget && !isLoading) {
            onClose();
        }
    };

    // Xử lý phím ESC
    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && !isLoading) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isLoading, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-fade-in"
            onClick={handleOverlayClick}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon & Title */}
                <div className="p-6 text-center">
                    {showIcon && (
                        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${config.iconBg} ${config.iconColor}`}>
                            <IconComponent size={24} />
                        </div>
                    )}

                    <h3 className="text-lg leading-6 font-bold text-gray-900">
                        {title}
                    </h3>

                    <div className="mt-2">
                        {typeof message === 'string' ? (
                            <p className="text-sm text-gray-500">{message}</p>
                        ) : (
                            message
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className="bg-gray-50 px-4 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.buttonBg}`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner />
                                Đang xử lý...
                            </span>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;