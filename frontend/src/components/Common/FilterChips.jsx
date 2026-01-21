import React from 'react';
import { FaTimes } from 'react-icons/fa';

/**
 * Component hiển thị các filter chips
 * 
 * @param {Array} filters - Mảng các filter [{ key, value, label, color }]
 * @param {Function} onRemove - Callback khi xóa filter (nhận key)
 * @param {Function} onClearAll - Callback khi xóa tất cả
 * @param {string} className - Class bổ sung
 */
const FilterChips = ({
    filters = [],
    onRemove,
    onClearAll,
    className = ''
}) => {
    if (filters.length === 0) return null;

    // Config màu cho các loại filter
    const colorConfig = {
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        purple: 'bg-purple-50 text-purple-700 border-purple-100',
        orange: 'bg-orange-50 text-orange-700 border-orange-100',
        green: 'bg-green-50 text-green-700 border-green-100',
        red: 'bg-red-50 text-red-700 border-red-100',
        gray: 'bg-gray-50 text-gray-700 border-gray-100'
    };

    return (
        <div className={`flex flex-wrap gap-2 mb-6 items-center ${className}`}>
            <span className="text-xs text-gray-500 font-medium mr-1">Bộ lọc: </span>

            {filters.map((filter) => (
                <div
                    key={filter.key}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs border shadow-sm ${colorConfig[filter.color] || colorConfig.gray}`}
                >
                    {filter.label}
                    <button
                        onClick={() => onRemove?.(filter.key)}
                        className="hover:opacity-70 rounded-full p-0.5 transition"
                    >
                        <FaTimes size={10} />
                    </button>
                </div>
            ))}

            {filters.length > 0 && (
                <button
                    onClick={onClearAll}
                    className="text-xs text-gray-500 hover:text-red-600 hover:underline ml-2"
                >
                    Xóa tất cả
                </button>
            )}
        </div>
    );
};

export default FilterChips;