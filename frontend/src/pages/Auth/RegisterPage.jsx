import React from 'react';
import {
  FaUser,
  FaLock,
  FaEnvelope,
  FaIdCard,
  FaUserPlus,
  FaCheckCircle
} from 'react-icons/fa';

// Components
import {
  AuthLayout,
  AuthInput,
  AuthButton,
  AuthFooter,
  PasswordStrength,
  PasswordRequirements
} from '../../components/Auth';

// Hooks
import { useRegister } from '../../hooks';

/**
 * =============================================================================
 * REGISTER PAGE
 * =============================================================================
 * Trang đăng ký tài khoản mới với: 
 * - Form đăng ký đầy đủ thông tin
 * - Validation realtime
 * - Hiển thị yêu cầu mật khẩu
 * - Hiển thị độ mạnh mật khẩu
 * - Xác nhận mật khẩu
 * =============================================================================
 */
const RegisterPage = () => {
  const { form, loading, validationRules, handleRegister } = useRegister();
  const { register, handleSubmit, watch, formState: { errors } } = form;

  const password = watch('password');

  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Đăng ký để bắt đầu quản lý tài liệu an toàn"
    >
      <form onSubmit={handleSubmit(handleRegister)} className="space-y-4">
        {/* Họ và tên */}
        <AuthInput
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          icon={FaIdCard}
          error={errors.fullName?.message}
          register={register('fullName', validationRules.fullName)}
        />

        {/* Tên đăng nhập */}
        <AuthInput
          label="Tên đăng nhập"
          placeholder="username123"
          icon={FaUser}
          error={errors.username?.message}
          register={register('username', validationRules.username)}
        />

        {/* Email */}
        <AuthInput
          label="Email"
          type="email"
          placeholder="example@gmail.com"
          icon={FaEnvelope}
          error={errors.email?.message}
          register={register('email', validationRules.email)}
        />

        {/* Mật khẩu */}
        <div>
          <AuthInput
            label="Mật khẩu"
            type="password"
            placeholder="Nhập mật khẩu"
            icon={FaLock}
            error={errors.password?.message}
            register={register('password', validationRules.password)}
          />

          {/* Hiển thị yêu cầu mật khẩu */}
          <PasswordRequirements password={password} />

          {/* Hiển thị độ mạnh */}
          <PasswordStrength password={password} />
        </div>

        {/* Xác nhận mật khẩu */}
        <AuthInput
          label="Xác nhận mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu"
          icon={FaCheckCircle}
          error={errors.confirmPassword?.message}
          register={register('confirmPassword', validationRules.confirmPassword)}
        />

        {/* Điều khoản */}
        <TermsAgreement />

        {/* Nút đăng ký */}
        <AuthButton loading={loading} variant="success">
          <FaUserPlus />
          <span>Đăng ký tài khoản</span>
        </AuthButton>
      </form>

      {/* Footer */}
      <AuthFooter
        text="Đã có tài khoản?"
        linkText="Đăng nhập ngay"
        linkTo="/login"
      />
    </AuthLayout>
  );
};

/**
 * Component hiển thị điều khoản sử dụng
 */
const TermsAgreement = () => (
  <p className="text-xs text-gray-500 text-center leading-relaxed">
    Bằng việc đăng ký, bạn đồng ý với{' '}
    <a href="/terms" className="text-blue-600 hover:underline">
      Điều khoản sử dụng
    </a>{' '}
    và{' '}
    <a href="/privacy" className="text-blue-600 hover:underline">
      Chính sách bảo mật
    </a>{' '}
    của chúng tôi.
  </p>
);

export default RegisterPage;