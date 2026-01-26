import React from 'react';

// Hooks
import { useChangePassword } from '../../hooks';

// Local Components (giả sử bạn để cùng thư mục hoặc import đúng đường dẫn)
import ModalHeader from './ModalHeader'; // Hoặc đường dẫn nơi bạn lưu file trên
import ModalFooter from './ModalFooter';
import PasswordInput from './PasswordInput';

// Shared Components (đã có từ trước)
import PasswordRequirements from '../../components/Auth/PasswordRequirements';
import PasswordStrength from '../../components/Auth/PasswordStrength';

const ChangePasswordModal = ({ isOpen = true, onClose, onSuccess }) => {
    // 1. Sử dụng Custom Hook để lấy logic
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        visibility,
        toggleVisibility,
        newPasswordValue,
        validationRules
    } = useChangePassword(onClose, onSuccess);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] animate-scale-up">
                
                {/* Header */}
                <ModalHeader onClose={onClose} />

                {/* Scrollable Body */}
                <div className="overflow-y-auto p-6 custom-scrollbar">
                    <form onSubmit={handleSubmit}>
                        
                        {/* 1. Mật khẩu hiện tại */}
                        <PasswordInput
                            label="Mật khẩu hiện tại"
                            name="currentPassword"
                            register={register}
                            rules={validationRules.currentPassword}
                            error={errors.currentPassword}
                            showPassword={visibility.current}
                            onToggleShow={() => toggleVisibility('current')}
                            autoComplete="current-password"
                        />

                        {/* 2. Mật khẩu mới */}
                        <PasswordInput
                            label="Mật khẩu mới"
                            name="newPassword"
                            register={register}
                            rules={validationRules.newPassword}
                            error={errors.newPassword}
                            showPassword={visibility.new}
                            onToggleShow={() => toggleVisibility('new')}
                            autoComplete="new-password"
                        />

                        {/* 4. Password Helpers (Requirement & Strength) */}
                        <div className="mt-4 space-y-3">
                            <PasswordRequirements 
                                password={newPasswordValue} 
                            />
                            
                            <PasswordStrength 
                                password={newPasswordValue} 
                            />
                        </div>

                        {/* 3. Xác nhận mật khẩu */}
                        <PasswordInput
                            label="Xác nhận mật khẩu mới"
                            name="confirmPassword"
                            register={register}
                            rules={validationRules.confirmPassword}
                            error={errors.confirmPassword}
                            showPassword={visibility.confirm}
                            onToggleShow={() => toggleVisibility('confirm')}
                            autoComplete="new-password"
                        />

                        {/* Footer */}
                        <ModalFooter onClose={onClose} isSubmitting={isSubmitting} />
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;