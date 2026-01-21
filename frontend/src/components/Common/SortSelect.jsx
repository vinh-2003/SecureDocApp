import React from 'react';

/**
 * Các tùy chọn sắp xếp mặc định
 */
export const SORT_OPTIONS = [
    { value: 'updatedAt-desc', label: 'Mới nhất' },
    { value: 'updatedAt-asc', label: 'Cũ nhất' },
    { value: 'name-asc', label: 'Tên (A-Z)' },
    { value: 'name-desc', label: 'Tên (Z-A)' },
    { value: 'size-desc', label: 'Kích thước giảm dần' },
    { value: 'size-asc', label: 'Kích thước tăng dần' }
];

/**
 * Component dropdown chọn cách sắp xếp
 * 
 * @param {string} value - Giá trị hiện tại (format: 'sortBy-direction')
 * @param {Function} onChange - Callback khi thay đổi ({ sortBy, direction })
 * @param {Array} options - Các tùy chọn sắp xếp (default: SORT_OPTIONS)
 * @param {boolean} showLabel - Hiển thị label "Sắp xếp:"
 * @param {string} className - Class bổ sung
 */
const SortSelect = ({
    value = 'updatedAt-desc',
    onChange,
    options = SORT_OPTIONS,
    showLabel = true,
    className = ''
}) => {
    const handleChange = (e) => {
        const [sortBy, direction] = e.target.value.split('-');
        onChange?.({ sortBy, direction });
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {showLabel && (
                <label className="text-sm text-gray-500 hidden sm:block">
                    Sắp xếp:
                </label>
            )}
            <select
                className="border border-gray-300 rounded px-2 py-1.5 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500"
                value={value}
                onChange={handleChange}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SortSelect;