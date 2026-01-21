import React, { useState, useRef, useEffect } from 'react';
import { FaCog, FaCheck } from 'react-icons/fa';

/**
 * Component cho phép bật/tắt các cột hiển thị
 * 
 * @param {Array} allColumns - Tất cả các cột có thể chọn [{ key, label, required }]
 * @param {Array} visibleColumns - Các cột đang hiển thị
 * @param {Function} onChange - Callback khi thay đổi
 * @param {string} className - Class bổ sung
 */
const ColumnToggle = ({
    allColumns = [],
    visibleColumns = [],
    onChange,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Đóng menu khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Toggle một cột
    const toggleColumn = (columnKey) => {
        const column = allColumns.find(c => c.key === columnKey);

        // Không cho tắt cột bắt buộc
        if (column?.required) return;

        const newColumns = visibleColumns.includes(columnKey)
            ? visibleColumns.filter(c => c !== columnKey)
            : [...visibleColumns, columnKey];

        onChange?.(newColumns);
    };

    // Kiểm tra cột có đang hiển thị không
    const isColumnVisible = (columnKey) => visibleColumns.includes(columnKey);

    return (
        <div className={`relative ${className}`} ref={menuRef}>
            {/* Nút mở menu */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-1.5 rounded transition flex items-center gap-1.5 text-sm border
                    ${isOpen
                        ? 'bg-blue-50 border-blue-300 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }
                `}
                title="Tùy chỉnh cột hiển thị"
            >
                <FaCog size={14} />
            </button>

            {/* Menu dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[180px] py-1 animate-fade-in">
                    <div className="px-3 py-2 border-b text-xs font-semibold text-gray-400 uppercase">
                        Hiển thị cột
                    </div>

                    {allColumns.map(column => (
                        <button
                            key={column.key}
                            onClick={() => toggleColumn(column.key)}
                            disabled={column.required}
                            className={`w-full px-3 py-2 flex items-center justify-between text-sm transition
                                ${column.required
                                    ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                                    : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                                }
                            `}
                        >
                            <span>{column.label}</span>
                            {isColumnVisible(column.key) && (
                                <FaCheck
                                    size={12}
                                    className={column.required ? 'text-gray-300' : 'text-blue-600'}
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ColumnToggle;