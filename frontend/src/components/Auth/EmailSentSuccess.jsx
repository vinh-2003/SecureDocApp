import React from 'react';
import { FaEnvelope, FaRedo, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';

/**
 * Component hiển thị khi đã gửi email thành công
 */
const EmailSentSuccess = ({
    email,
    title = 'Kiểm tra email của bạn',
    description,
    onResend,
    onBack,
    loading = false
}) => {
    const defaultDescription = `Chúng tôi đã gửi link đặt lại mật khẩu đến địa chỉ email ${email}. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác).`;

    return (
        <div className="text-center py-4">
            {/* Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaEnvelope className="text-green-600 text-3xl" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-800 mb-3">
                {title}
            </h3>

            {/* Description */}
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
                {description || defaultDescription}
            </p>

            {/* Email highlight */}
            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6">
                <p className="text-sm text-gray-600">
                    Email đã gửi đến:
                </p>
                <p className="font-medium text-gray-800">
                    {email}
                </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                {/* Resend button */}
                {onResend && (
                    <button
                        onClick={onResend}
                        disabled={loading}
                        className="w-full py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <FaRedo size={12} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Đang gửi...' : 'Gửi lại email'}
                    </button>
                )}

                {/* Change email button */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="w-full py-3 px-4 text-sm text-gray-500 hover:text-blue-600 transition flex items-center justify-center gap-2"
                    >
                        <FaArrowLeft size={12} />
                        Sử dụng email khác
                    </button>
                )}
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-gray-100" />

            {/* Back to login */}
            <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
                Quay lại Đăng nhập
            </Link>
        </div>
    );
};

export default EmailSentSuccess;