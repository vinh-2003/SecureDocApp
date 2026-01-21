import React from 'react';
import { FaEnvelope, FaPaperPlane } from 'react-icons/fa';

// Components
import {
  AuthLayout,
  AuthInput,
  AuthButton,
  AuthBackLink,
  EmailSentSuccess
} from '../../components/Auth';

// Hooks
import { useForgotPassword } from '../../hooks';

/**
 * =============================================================================
 * FORGOT PASSWORD PAGE
 * =============================================================================
 * Trang quên mật khẩu với: 
 * - Form nhập email
 * - Gửi link đặt lại mật khẩu
 * - Hiển thị thành công sau khi gửi
 * - Gửi lại email
 * =============================================================================
 */
const ForgotPasswordPage = () => {
  const {
    form,
    loading,
    emailSent,
    sentEmail,
    validationRules,
    handleSubmit,
    handleResend,
    handleReset
  } = useForgotPassword();

  const { register, handleSubmit: formHandleSubmit, formState: { errors } } = form;

  return (
    <AuthLayout
      title={emailSent ? undefined : 'Quên mật khẩu? '}
      subtitle={emailSent ? undefined : 'Nhập email của bạn để nhận link đặt lại mật khẩu'}
    >
      {emailSent ? (
        // Hiển thị thành công
        <EmailSentSuccess
          email={sentEmail}
          onResend={handleResend}
          onBack={handleReset}
          loading={loading}
        />
      ) : (
        // Form nhập email
        <>
          <ForgotPasswordForm
            register={register}
            errors={errors}
            loading={loading}
            validationRules={validationRules}
            onSubmit={formHandleSubmit(handleSubmit)}
          />

          <AuthBackLink
            to="/login"
            text="Quay lại Đăng nhập"
          />
        </>
      )}
    </AuthLayout>
  );
};

/**
 * Form nhập email
 */
const ForgotPasswordForm = ({
  register,
  errors,
  loading,
  validationRules,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Email Input */}
      <AuthInput
        label="Email đã đăng ký"
        type="email"
        placeholder="example@gmail.com"
        icon={FaEnvelope}
        error={errors.email?.message}
        register={register('email', validationRules.email)}
      />

      {/* Hint */}
      <p className="text-xs text-gray-500 leading-relaxed">
        Chúng tôi sẽ gửi link đặt lại mật khẩu vào email này.
        Link có hiệu lực trong 24 giờ.
      </p>

      {/* Submit Button */}
      <AuthButton loading={loading}>
        <FaPaperPlane />
        <span>Gửi link xác nhận</span>
      </AuthButton>
    </form>
  );
};

export default ForgotPasswordPage;