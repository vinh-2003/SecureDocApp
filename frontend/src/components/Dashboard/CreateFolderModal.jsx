import React, { useEffect, useRef } from 'react';
import { FaFolderPlus } from 'react-icons/fa';

/**
 * Modal tạo thư mục mới
 * 
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {Function} onClose - Callback đóng modal
 * @param {Function} onSubmit - Callback khi submit (nhận folderName)
 * @param {string} value - Giá trị input
 * @param {Function} onChange - Callback khi thay đổi input
 */
const CreateFolderModal = ({
    isOpen,
    onClose,
    onSubmit,
    value = '',
    onChange
}) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value.trim());
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 animate-fade-in-down">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                        <FaFolderPlus size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Tạo thư mục mới</h3>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus: ring-blue-500 focus: border-transparent mb-4 transition"
                        placeholder="Nhập tên thư mục..."
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={!value.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Tạo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFolderModal;