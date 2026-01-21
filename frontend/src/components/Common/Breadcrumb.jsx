import React from 'react';
import { FaChevronRight, FaHome, FaShareAlt, FaTrash, FaClock, FaCaretDown } from 'react-icons/fa';

/**
 * Các loại root breadcrumb
 */
export const BREADCRUMB_ROOTS = {
    MY_ROOT: 'MY_ROOT',
    SHARED_ROOT: 'SHARED_ROOT',
    TRASH_ROOT: 'TRASH_ROOT',
    RECENT_ROOT: 'RECENT_ROOT'
};

/**
 * Component hiển thị thanh Breadcrumb điều hướng
 * 
 * @param {Array} items - Mảng các item breadcrumb [{ id, name, isRoot, type, path }]
 * @param {Function} onItemClick - Callback khi click vào item
 * @param {Function} onMenuClick - Callback khi click vào mũi tên menu (item cuối)
 * @param {Function} onContextMenu - Callback khi chuột phải vào item cuối
 * @param {boolean} showMenuOnLast - Hiển thị menu dropdown ở item cuối
 * @param {string} className - Class bổ sung
 */
const Breadcrumb = ({
    items = [],
    onItemClick,
    onMenuClick,
    onContextMenu,
    showMenuOnLast = true,
    className = ''
}) => {
    // Config icon cho các loại root
    const rootIcons = {
        [BREADCRUMB_ROOTS.MY_ROOT]: <FaHome className="text-gray-500" />,
        [BREADCRUMB_ROOTS.SHARED_ROOT]: <FaShareAlt className="text-gray-500" />,
        [BREADCRUMB_ROOTS.TRASH_ROOT]: <FaTrash className="text-gray-500" />,
        [BREADCRUMB_ROOTS.RECENT_ROOT]: <FaClock className="text-gray-500" />
    };

    // Render một item
    const renderItem = (item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        // Chỉ hiện menu nếu là item cuối VÀ không phải root VÀ được cho phép
        const canShowMenu = showMenuOnLast && isLast && !item.isRoot;

        return (
            <React.Fragment key={item.id || item.type || index}>
                <div
                    onClick={() => !isLast && onItemClick?.(item)}
                    onContextMenu={(e) => {
                        if (canShowMenu && onContextMenu) {
                            e.preventDefault();
                            onContextMenu(e, item);
                        }
                    }}
                    className={`
                        flex items-center gap-2 px-2 py-1 rounded-md transition-colors select-none
                        ${isLast
                            ? 'font-bold text-gray-800 bg-blue-50 cursor-default'
                            : 'cursor-pointer hover:bg-gray-100 text-gray-600'
                        }
                    `}
                >
                    {/* Icon cho root */}
                    {isFirst && item.type && rootIcons[item.type]}

                    {/* Tên */}
                    <span className="truncate max-w-[200px]">{item.name}</span>

                    {/* Mũi tên menu dropdown */}
                    {canShowMenu && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onMenuClick?.(e, item);
                            }}
                            className="ml-1 p-0.5 rounded-sm hover:bg-blue-200 text-gray-500 hover:text-blue-700 cursor-pointer transition"
                        >
                            <FaCaretDown size={12} />
                        </div>
                    )}
                </div>

                {/* Dấu mũi tên ngăn cách */}
                {!isLast && (
                    <FaChevronRight className="text-gray-300 text-xs mx-1" />
                )}
            </React.Fragment>
        );
    };

    if (items.length === 0) return null;

    return (
        <div className={`flex items-center gap-1 mb-4 text-sm text-gray-600 bg-white p-2 rounded-lg border border-gray-200 overflow-x-auto whitespace-nowrap shadow-sm ${className}`}>
            {items.map((item, index) => renderItem(item, index))}
        </div>
    );
};

export default Breadcrumb;