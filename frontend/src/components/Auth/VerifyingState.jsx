import React from 'react';
import { FaSpinner, FaEnvelopeOpen } from 'react-icons/fa';

/**
 * Component hiển thị trạng thái đang xác thực
 */
const VerifyingState = ({ message = 'Đang xác thực tài khoản của bạn...' }) => {
    return (
        <div className="text-center py-8">
            {/* Icon */}
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <FaEnvelopeOpen className="text-blue-600 text-4xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <FaSpinner className="text-blue-500 text-lg animate-spin" />
                </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-800 mb-3">
                Đang xử lý...
            </h2>

            {/* Message */}
            <p className="text-gray-500 text-sm leading-relaxed">
                {message}
            </p>

            {/* Loading bar */}
            <div className="mt-6 max-w-xs mx-auto">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-loading-bar" />
                </div>
            </div>

            {/* Hint */}
            <p className="text-xs text-gray-400 mt-4">
                Vui lòng đợi trong giây lát...
            </p>
        </div>
    );
};

export default VerifyingState;