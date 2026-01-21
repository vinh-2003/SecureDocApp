import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

/**
 * Modal xác nhận gỡ quyền truy cập
 * 
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {Function} onClose - Callback đóng modal
 * @param {Function} onConfirm - Callback khi xác nhận
 * @param {Object} user - User đang được gỡ quyền
 * @param {boolean} loading - Trạng thái loading
 */
const ConfirmRevokeModal = ({
    isOpen,
    onClose,
    onConfirm,
    user,
    loading = false
}) => {
    if (!isOpen || !user) return null;

    return (
        <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-lg shadow-xl p-6 w-[400px] animate-fade-in-down border-t-4 border-red-500">

                {/* Icon cảnh báo & Tiêu đề */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-red-100 rounded-full text-red-600 shrink-0">
                        <FaExclamationTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Ngừng chia sẻ? </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Bạn có chắc chắn muốn gỡ bỏ quyền truy cập của{' '}
                            <span className="font-bold text-gray-800">{user.email}</span> không?
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Họ sẽ không còn xem hoặc chỉnh sửa được tài liệu này nữa.
                        </p>
                    </div>
                </div>

                {/* Nút hành động */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
                        disabled={loading}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {loading ? 'Đang xử lý...' : 'Đồng ý gỡ bỏ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmRevokeModal;