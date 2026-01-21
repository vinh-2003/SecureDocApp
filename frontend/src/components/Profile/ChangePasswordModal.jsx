import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { FaTimes, FaEye, FaEyeSlash, FaLock, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import userService from '../../services/userService';

/**
 * =============================================================================
 * CHANGE PASSWORD MODAL
 * =============================================================================
 * Modal cho phép người dùng đổi mật khẩu
 * 
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {Function} onClose - Callback đóng modal
 * @param {Function} onSuccess - Callback khi đổi mật khẩu thành công (optional)
 * =============================================================================
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const PASSWORD_MIN_LENGTH = 6;

const VALIDATION_RULES = {
    currentPassword: {
        required: 'Vui lòng nhập mật khẩu hiện tại'
    },
    newPassword: {
        required: 'Vui lòng nhập mật khẩu mới',
        minLength: {
            value: PASSWORD_MIN_LENGTH,
            message: `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`
        }
    },
    confirmPassword: {
        required: 'Vui lòng xác nhận mật khẩu'
    }
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Input field với toggle show/hide password
 */
const PasswordInput = ({
    label,
    name,
    register,
    validation,
    error,
    showPassword,
    onToggleShow,
    placeholder = '••••••••'
}) => {
    return (
        <div className="mb-4">
            <label
                htmlFor={name}
                className="block text-sm font-medium text-gray-700 mb-1.5"
            >
                {label}
            </label>

            <div className="relative">
                {/* Icon trái */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400 text-sm" />
                </div>

                {/* Input */}
                <input
                    id={name}
                    type={showPassword ? 'text' : 'password'}
                    {...register(name, validation)}
                    className={`
                        w-full pl-10 pr-10 py-2.5 border rounded-lg outline-none 
                        transition-all duration-200
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                    `}
                    placeholder={placeholder}
                    autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
                />

                {/* Toggle button */}
                <button
                    type="button"
                    onClick={onToggleShow}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>

            {/* Error message */}
            {error && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {error.message}
                </p>
            )}
        </div>
    );
};

/**
 * Header của modal
 */
const ModalHeader = ({ onClose }) => (
    <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
                <FaShieldAlt className="text-blue-600" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800">Đổi mật khẩu</h3>
                <p className="text-xs text-gray-500">Cập nhật mật khẩu để bảo vệ tài khoản</p>
            </div>
        </div>
        <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition"
            aria-label="Đóng"
        >
            <FaTimes size={18} />
        </button>
    </div>
);

/**
 * Footer với các nút action
 */
const ModalFooter = ({ onClose, isSubmitting }) => (
    <div className="flex justify-end gap-3 pt-4 mt-2 border-t">
        <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition font-medium disabled:opacity-50"
        >
            Hủy bỏ
        </button>
        <button
            type="submit"
            disabled={isSubmitting}
            className={`
                px-6 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium 
                shadow-md transition transform 
                hover:bg-blue-700 active:scale-95
                disabled:opacity-70 disabled:cursor-not-allowed
                flex items-center gap-2
            `}
        >
            {isSubmitting ? (
                <>
                    <LoadingSpinner />
                    Đang xử lý...
                </>
            ) : (
                'Lưu thay đổi'
            )}
        </button>
    </div>
);

/**
 * Loading spinner nhỏ
 */
const LoadingSpinner = () => (
    <svg
        className="animate-spin h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ChangePasswordModal = ({ isOpen = true, onClose, onSuccess }) => {
    // Form
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting }
    } = useForm();

    // Password visibility states
    const [visibility, setVisibility] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Watch new password for confirm validation
    const newPassword = watch('newPassword');

    // Toggle password visibility
    const toggleVisibility = useCallback((field) => {
        setVisibility(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    }, []);

    // Handle form submit
    const onSubmit = async (data) => {
        try {
            const res = await userService.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });

            if (res.success) {
                toast.success('Đổi mật khẩu thành công!');
                reset();
                onSuccess?.();
                onClose();
            }
        } catch (error) {
            const message = error.response?.data?.message
                || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.';
            toast.error(message);
        }
    };

    // Handle close
    const handleClose = () => {
        if (!isSubmitting) {
            reset();
            onClose();
        }
    };

    // Handle overlay click
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in"
            onClick={handleOverlayClick}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <ModalHeader onClose={handleClose} />

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                    {/* Current Password */}
                    <PasswordInput
                        label="Mật khẩu hiện tại"
                        name="currentPassword"
                        register={register}
                        validation={VALIDATION_RULES.currentPassword}
                        error={errors.currentPassword}
                        showPassword={visibility.current}
                        onToggleShow={() => toggleVisibility('current')}
                    />

                    {/* New Password */}
                    <PasswordInput
                        label="Mật khẩu mới"
                        name="newPassword"
                        register={register}
                        validation={VALIDATION_RULES.newPassword}
                        error={errors.newPassword}
                        showPassword={visibility.new}
                        onToggleShow={() => toggleVisibility('new')}
                    />

                    {/* Confirm Password */}
                    <PasswordInput
                        label="Xác nhận mật khẩu mới"
                        name="confirmPassword"
                        register={register}
                        validation={{
                            ...VALIDATION_RULES.confirmPassword,
                            validate: (value) =>
                                value === newPassword || 'Mật khẩu xác nhận không khớp'
                        }}
                        error={errors.confirmPassword}
                        showPassword={visibility.confirm}
                        onToggleShow={() => toggleVisibility('confirm')}
                    />

                    {/* Password requirements hint */}
                    <p className="text-xs text-gray-400 mb-4">
                        💡 Mật khẩu phải có ít nhất {PASSWORD_MIN_LENGTH} ký tự
                    </p>

                    {/* Footer */}
                    <ModalFooter
                        onClose={handleClose}
                        isSubmitting={isSubmitting}
                    />
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;