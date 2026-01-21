import React from 'react';

/**
 * Component nhập lý do yêu cầu
 * 
 * @param {string} value - Giá trị hiện tại
 * @param {Function} onChange - Callback khi thay đổi
 * @param {string} placeholder - Placeholder text
 * @param {number} rows - Số dòng textarea
 * @param {number} maxLength - Độ dài tối đa
 */
const ReasonInput = ({
    value,
    onChange,
    placeholder = 'VD: Em cần tài liệu này để làm đồ án môn học.. .',
    rows = 3,
    maxLength = 500
}) => {
    const charCount = value.length;
    const isNearLimit = charCount > maxLength * 0.8;

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do xin quyền <span className="text-red-500">*</span>
            </label>

            <textarea
                rows={rows}
                maxLength={maxLength}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required
            />

            {/* Character count */}
            <div className="flex justify-end mt-1">
                <span className={`text-xs ${isNearLimit ? 'text-orange-500' : 'text-gray-400'}`}>
                    {charCount}/{maxLength}
                </span>
            </div>
        </div>
    );
};

export default ReasonInput;