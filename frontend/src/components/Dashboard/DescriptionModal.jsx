import React, { useEffect, useRef } from 'react';
import { FaInfoCircle } from 'react-icons/fa';

/**
 * Modal cập nhật mô tả file/folder
 * 
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {Function} onClose - Callback đóng modal
 * @param {Function} onSubmit - Callback khi submit
 * @param {Object} item - File/folder đang được cập nhật mô tả
 * @param {string} value - Giá trị textarea (mô tả)
 * @param {Function} onChange - Callback khi thay đổi textarea
 * @param {number} maxLength - Độ dài tối đa của mô tả (default: 1000)
 */
const DescriptionModal = ({
    isOpen,
    onClose,
    onSubmit,
    item,
    value = '',
    onChange,
    maxLength = 1000
}) => {
    const textareaRef = useRef(null);

    useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(value);
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 animate-fade-in-down">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                        <FaInfoCircle size={16} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Cập nhật mô tả</h3>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mô tả cho:
                            <span
                                className="font-bold text-blue-600 truncate inline-block max-w-[200px] align-bottom ml-1"
                                title={item?.name}
                            >
                                {item?.name}
                            </span>
                        </label>
                        <textarea
                            ref={textareaRef}
                            rows={4}
                            maxLength={maxLength}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
                            placeholder="Nhập mô tả chi tiết..."
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">
                            {value.length}/{maxLength} ký tự
                        </p>
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
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DescriptionModal;