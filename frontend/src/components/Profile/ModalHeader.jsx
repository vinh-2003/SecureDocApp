import React from 'react';
import { FaShieldAlt, FaTimes } from 'react-icons/fa';

const ModalHeader = ({ onClose }) => (
    <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg shadow-sm">
                <FaShieldAlt className="text-blue-600" size={20} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800">Đổi mật khẩu</h3>
                <p className="text-xs text-gray-500">Cập nhật mật khẩu để bảo vệ tài khoản</p>
            </div>
        </div>
        <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            title="Đóng"
        >
            <FaTimes size={18} />
        </button>
    </div>
);

export default ModalHeader;