import React from 'react';
import { FaCheckCircle, FaSignInAlt } from 'react-icons/fa';

/**
 * Component hiển thị trạng thái xác thực thành công
 */
const VerifySuccessState = ({
    message,
    countdown = 5,
    onGoToLogin
}) => {
    return (
        <div className="text-center py-4">
            {/* Icon với animation */}
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
                <FaCheckCircle className="text-green-500 text-5xl" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Xác thực thành công!
            </h2>

            {/* Message */}
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {message}
            </p>

            {/* Success card */}
            <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-100">
                <div className="flex items-center justify-center gap-2 text-green-700">
                    <FaCheckCircle size={16} />
                    <span className="text-sm font-medium">
                        Tài khoản đã được kích hoạt
                    </span>
                </div>
            </div>

            {/* Login button */}
            <button
                onClick={onGoToLogin}
                className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
            >
                <FaSignInAlt />
                <span>Đăng nhập ngay</span>
            </button>

            {/* Countdown */}
            <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <span>Tự động chuyển trang sau</span>
                <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full font-medium text-gray-600">
                    {countdown}
                </span>
                <span>giây</span>
            </p>
        </div>
    );
};

export default VerifySuccessState;