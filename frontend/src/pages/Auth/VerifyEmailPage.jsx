import React from 'react';

// Components
import {
  AuthLayout,
  VerifyingState,
  VerifySuccessState,
  VerifyErrorState
} from '../../components/Auth';

// Hooks
import { useVerifyEmail, VERIFY_STATUS } from '../../hooks';

/**
 * =============================================================================
 * VERIFY EMAIL PAGE
 * =============================================================================
 * Trang xác thực email với: 
 * - Tự động xác thực token từ URL
 * - Hiển thị trạng thái loading
 * - Hiển thị thành công với countdown
 * - Hiển thị lỗi với hướng dẫn
 * =============================================================================
 */
const VerifyEmailPage = () => {
  const {
    status,
    message,
    countdown,
    goToLogin,
    requestResend
  } = useVerifyEmail();

  // Render content dựa trên trạng thái
  const renderContent = () => {
    switch (status) {
      case VERIFY_STATUS.LOADING:
        return <VerifyingState message={message} />;

      case VERIFY_STATUS.SUCCESS:
        return (
          <VerifySuccessState
            message={message}
            countdown={countdown}
            onGoToLogin={goToLogin}
          />
        );

      case VERIFY_STATUS.ERROR:
        return (
          <VerifyErrorState
            message={message}
            onRequestResend={requestResend}
          />
        );

      default:
        return null;
    }
  };

  return (
    <AuthLayout showLogo={true}>
      {renderContent()}
    </AuthLayout>
  );
};

export default VerifyEmailPage;