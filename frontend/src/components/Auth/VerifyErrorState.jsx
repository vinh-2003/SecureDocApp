import React from 'react';
import { Link } from 'react-router-dom';
import { FaTimesCircle, FaRedo, FaSignInAlt, FaEnvelope } from 'react-icons/fa';

/**
 * Component hiển thị trạng thái xác thực thất bại
 */
const VerifyErrorState = ({
    message,
    onRequestResend
}) => {
    return (
        <div className="text-center py-4">
            {/* Icon */}
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaTimesCircle className="text-red-500 text-5xl" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Xác thực thất bại
            </h2>

            {/* Message */}
            <p className="text-red-600 text-sm leading-relaxed mb-6">
                {message}
            </p>

            {/* Error info card */}
            <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-100 text-left">
                <p className="text-xs font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <FaEnvelope />
                    Có thể xảy ra vì:
                </p>
                <ul className="text-xs text-amber-700 space-y-1 ml-5">
                    <li>• Link xác thực đã hết hạn (sau 24 giờ)</li>
                    <li>• Link đã được sử dụng trước đó</li>
                    <li>• Đường dẫn không đúng hoặc bị hỏng</li>
                </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                {/* Resend button */}
                <button
                    onClick={onRequestResend}
                    className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                    <FaRedo />
                    <span>Gửi lại email xác thực</span>
                </button>

                {/* Back to login */}
                <Link
                    to="/login"
                    className="w-full py-3 px-6 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:bg-gray-50"
                >
                    <FaSignInAlt />
                    <span>Quay lại Đăng nhập</span>
                </Link>
            </div>
        </div>
    );
};

export default VerifyErrorState;