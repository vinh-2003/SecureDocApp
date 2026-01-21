import React from 'react';
import { FaLock, FaCheckCircle, FaKey } from 'react-icons/fa';

// Components
import {
  AuthLayout,
  AuthInput,
  AuthButton,
  PasswordStrength,
  PasswordRequirements,
  ResetPasswordSuccess,
  InvalidTokenError
} from '../../components/Auth';

// Hooks
import { useResetPassword } from '../../hooks';

/**
 * =============================================================================
 * RESET PASSWORD PAGE
 * =============================================================================
 * Trang đặt lại mật khẩu với:  
 * - Kiểm tra token từ URL
 * - Form nhập mật khẩu mới
 * - Yêu cầu mật khẩu mạnh
 * - Hiển thị thành công/lỗi
 * =============================================================================
 */
const ResetPasswordPage = () => {
  const {
    form,
    loading,
    isSuccess,
    isValidToken,
    newPassword,
    validationRules,
    handleSubmit,
    goToLogin
  } = useResetPassword();

  const { register, handleSubmit: formHandleSubmit, formState: { errors } } = form;

  // Token không hợp lệ
  if (!isValidToken) {
    return (
      <AuthLayout>
        <InvalidTokenError />
      </AuthLayout>
    );
  }

  // Đổi mật khẩu thành công
  if (isSuccess) {
    return (
      <AuthLayout>
        <ResetPasswordSuccess onGoToLogin={goToLogin} />
      </AuthLayout>
    );
  }

  // Form đổi mật khẩu
  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Tạo mật khẩu mới cho tài khoản của bạn"
    >
      <form onSubmit={formHandleSubmit(handleSubmit)} className="space-y-4">
        {/* Mật khẩu mới */}
        <div>
          <AuthInput
            label="Mật khẩu mới"
            type="password"
            placeholder="Nhập mật khẩu mới"
            icon={FaLock}
            error={errors.newPassword?.message}
            register={register('newPassword', validationRules.newPassword)}
          />

          {/* Yêu cầu mật khẩu */}
          <PasswordRequirements password={newPassword} />

          {/* Độ mạnh mật khẩu */}
          <PasswordStrength password={newPassword} />
        </div>

        {/* Xác nhận mật khẩu */}
        <AuthInput
          label="Xác nhận mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          icon={FaCheckCircle}
          error={errors.confirmPassword?.message}
          register={register('confirmPassword', validationRules.confirmPassword)}
        />

        {/* Nút submit */}
        <AuthButton loading={loading} variant="success">
          <FaKey />
          <span>Đổi mật khẩu</span>
        </AuthButton>
      </form>

      {/* Security notice */}
      <SecurityNotice />
    </AuthLayout>
  );
};

/**
 * Thông báo bảo mật
 */
const SecurityNotice = () => (
  <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
    <p className="text-xs text-amber-800 leading-relaxed">
      <span className="font-medium">🔒 Lưu ý bảo mật:</span> Sau khi đổi mật khẩu,
      bạn sẽ bị đăng xuất khỏi tất cả các thiết bị khác.
      Vui lòng đăng nhập lại với mật khẩu mới.
    </p>
  </div>
);

export default ResetPasswordPage;