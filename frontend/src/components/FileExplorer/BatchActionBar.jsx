import React from 'react';
import { FaExchangeAlt, FaTrash, FaTrashRestore, FaBan } from 'react-icons/fa';

/**
 * Các loại batch action có thể sử dụng
 */
export const BATCH_ACTIONS = {
    MOVE: 'move',
    DELETE: 'delete',
    RESTORE: 'restore',
    DELETE_PERMANENT: 'delete_permanent'
};

/**
 * Cấu hình cho từng loại action
 */
const ACTION_CONFIG = {
    [BATCH_ACTIONS.MOVE]: {
        label: 'Di chuyển',
        icon: <FaExchangeAlt className="text-gray-500" />,
        className: 'bg-white text-gray-700 border-gray-300 hover: bg-gray-100',
        permissionKey: 'canMove'
    },
    [BATCH_ACTIONS.DELETE]: {
        label: 'Chuyển vào thùng rác',
        icon: <FaTrash />,
        className: 'bg-white text-red-600 border-gray-300 hover: bg-red-50',
        permissionKey: 'canDelete'
    },
    [BATCH_ACTIONS.RESTORE]: {
        label: 'Khôi phục',
        icon: <FaTrashRestore />,
        className: 'bg-white text-green-700 border-green-200 hover:bg-green-50',
        permissionKey: 'canRestore'
    },
    [BATCH_ACTIONS.DELETE_PERMANENT]: {
        label: 'Xóa vĩnh viễn',
        icon: <FaBan />,
        className: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
        permissionKey: 'canDeletePermanently'
    }
};

/**
 * Component hiển thị thanh hành động hàng loạt
 * 
 * @param {number} selectedCount - Số lượng item đã chọn
 * @param {Array} selectedFiles - Danh sách files đã chọn
 * @param {Function} onClearSelection - Callback bỏ chọn tất cả
 * @param {Function} onAction - Callback xử lý action (actionType) => void
 * @param {Array} actions - Danh sách các action cần hiển thị
 * @param {string} variant - Kiểu hiển thị:  'default' | 'trash'
 */
const BatchActionBar = ({
    selectedCount = 0,
    selectedFiles = [],
    onClearSelection,
    onAction,
    actions = [BATCH_ACTIONS.MOVE, BATCH_ACTIONS.DELETE],
    variant = 'default'
}) => {
    // Không hiển thị nếu không có item nào được chọn
    if (selectedCount === 0) return null;

    // Kiểm tra quyền cho từng action
    const canPerformAction = (actionType) => {
        const config = ACTION_CONFIG[actionType];
        if (!config) return false;

        // Nếu có permissionKey, kiểm tra tất cả files có quyền không
        if (config.permissionKey) {
            return selectedFiles.every(f => f.permissions?.[config.permissionKey] !== false);
        }

        return true;
    };

    // Render một nút action
    const renderActionButton = (actionType) => {
        const config = ACTION_CONFIG[actionType];
        if (!config) return null;

        const canDo = canPerformAction(actionType);
        if (!canDo) return null;

        return (
            <button
                key={actionType}
                onClick={() => onAction(actionType)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded text-sm font-medium transition shadow-sm ${config.className}`}
            >
                {config.icon} {config.label}
            </button>
        );
    };

    // Style dựa trên variant
    const barClassName = variant === 'trash'
        ? 'bg-red-50 border-red-200'
        : 'bg-blue-50 border-blue-200';

    const countClassName = variant === 'trash'
        ? 'text-red-800'
        : 'text-blue-800';

    const clearClassName = variant === 'trash'
        ? 'text-red-600'
        : 'text-blue-600';

    return (
        <div className={`${barClassName} border p-2 rounded-lg mb-4 flex justify-between items-center animate-fade-in`}>
            <div className="flex items-center gap-3 px-2">
                <span className={`font-bold ${countClassName} text-sm`}>
                    {selectedCount} mục đã chọn
                </span>
                <button
                    onClick={onClearSelection}
                    className={`text-xs ${clearClassName} hover: underline`}
                >
                    Bỏ chọn
                </button>
            </div>

            <div className="flex items-center gap-2">
                {actions.map(action => renderActionButton(action))}
            </div>
        </div>
    );
};

export default BatchActionBar;