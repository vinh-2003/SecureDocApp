import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

/**
 * Component hiển thị khi token không hợp lệ
 */
const InvalidTokenError = () => {
    return (
        <div className="text-center py-4">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaExclamationTriangle className="text-red-500 text-3xl" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-800 mb-3">
                Link không hợp lệ
            </h3>

            {/* Description */}
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                Vui lòng yêu cầu link mới.
            </p>

            {/* Actions */}
            <div className="space-y-3">
                <Link
                    to="/forgot-password"
                    className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                    <FaRedo />
                    <span>Yêu cầu link mới</span>
                </Link>

                <Link
                    to="/login"
                    className="block text-sm text-gray-500 hover:text-blue-600 transition"
                >
                    Quay lại Đăng nhập
                </Link>
            </div>
        </div>
    );
};

export default InvalidTokenError;