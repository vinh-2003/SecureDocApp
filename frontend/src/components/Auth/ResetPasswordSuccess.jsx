import React from 'react';
import { FaCheckCircle, FaSignInAlt } from 'react-icons/fa';

/**
 * Component hiển thị khi đặt lại mật khẩu thành công
 */
const ResetPasswordSuccess = ({ onGoToLogin }) => {
    return (
        <div className="text-center py-4">
            {/* Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                <FaCheckCircle className="text-green-600 text-4xl" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-800 mb-3">
                Đổi mật khẩu thành công!
            </h3>

            {/* Description */}
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Mật khẩu của bạn đã được cập nhật.
                Bây giờ bạn có thể đăng nhập với mật khẩu mới.
            </p>

            {/* Tips */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs font-medium text-blue-800 mb-2">
                    💡 Mẹo bảo mật:
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Không chia sẻ mật khẩu với người khác</li>
                    <li>• Sử dụng mật khẩu khác nhau cho mỗi tài khoản</li>
                    <li>• Đổi mật khẩu định kỳ để tăng bảo mật</li>
                </ul>
            </div>

            {/* Login Button */}
            <button
                onClick={onGoToLogin}
                className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
            >
                <FaSignInAlt />
                <span>Đăng nhập ngay</span>
            </button>
        </div>
    );
};

export default ResetPasswordSuccess;