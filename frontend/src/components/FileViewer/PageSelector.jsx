import React from 'react';

/**
 * Component chọn các trang cần mở khóa
 * 
 * @param {Array} pages - Danh sách trang bị khóa
 * @param {Array} selectedPages - Danh sách index trang đã chọn
 * @param {Function} onToggle - Callback toggle trang
 * @param {Function} onSelectAll - Callback chọn tất cả
 * @param {Function} onDeselectAll - Callback bỏ chọn tất cả
 * @param {number} selectedCount - Số trang đã chọn
 * @param {boolean} isAllSelected - Đã chọn tất cả chưa
 */
const PageSelector = ({
    pages = [],
    selectedPages = [],
    onToggle,
    onSelectAll,
    onDeselectAll,
    selectedCount = 0,
    isAllSelected = false
}) => {
    const hasPages = pages.length > 0;

    return (
        <div className="mb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                    Chọn các trang bạn muốn xem
                    <span className="text-blue-600 ml-1">({selectedCount} đã chọn)</span>
                </label>

                {hasPages && (
                    <SelectAllButton
                        isAllSelected={isAllSelected}
                        onSelectAll={onSelectAll}
                        onDeselectAll={onDeselectAll}
                    />
                )}
            </div>

            {/* Page Grid */}
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50 custom-scrollbar">
                {hasPages ? (
                    <div className="grid grid-cols-4 gap-2">
                        {pages.map((page) => (
                            <PageItem
                                key={page.id}
                                pageIndex={page.pageIndex}
                                isSelected={selectedPages.includes(page.pageIndex)}
                                onClick={() => onToggle(page.pageIndex)}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
};

/**
 * Button chọn/bỏ chọn tất cả
 */
const SelectAllButton = ({ isAllSelected, onSelectAll, onDeselectAll }) => (
    <button
        type="button"
        onClick={isAllSelected ? onDeselectAll : onSelectAll}
        className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition"
    >
        {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
    </button>
);

/**
 * Item trang đơn lẻ
 */
const PageItem = ({ pageIndex, isSelected, onClick }) => (
    <div
        onClick={onClick}
        className={`
            cursor-pointer text-sm py-1.5 px-2 rounded border text-center 
            transition-all duration-150 select-none
            ${isSelected
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
            }
        `}
    >
        Trang {pageIndex + 1}
    </div>
);

/**
 * Empty state khi không có trang nào
 */
const EmptyState = () => (
    <p className="text-center text-sm text-gray-500 py-4">
        Không có trang nào cần mở khóa.
    </p>
);

export default PageSelector;