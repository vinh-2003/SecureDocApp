import React, { useEffect, useRef } from 'react';
import { FaPen } from 'react-icons/fa';

/**
 * Modal đổi tên file/folder
 * 
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {Function} onClose - Callback đóng modal
 * @param {Function} onSubmit - Callback khi submit
 * @param {Object} item - File/folder đang được đổi tên
 * @param {string} value - Giá trị input (tên mới)
 * @param {Function} onChange - Callback khi thay đổi input
 */
const RenameModal = ({
    isOpen,
    onClose,
    onSubmit,
    item,
    value = '',
    onChange
}) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value.trim());
    };

    const isFolder = item?.type === 'FOLDER';

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 animate-fade-in-down">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                        <FaPen size={16} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Đổi tên</h3>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên mới
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus: ring-blue-500 focus:border-transparent transition"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                        />
                        {!isFolder && (
                            <p className="text-xs text-gray-500 mt-1">
                                Lưu ý:  Nếu không nhập đuôi file, hệ thống sẽ giữ nguyên đuôi cũ.
                            </p>
                        )}
                    </div>

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
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RenameModal;