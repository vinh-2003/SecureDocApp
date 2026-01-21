import React, { useRef } from 'react';
import { FaTrashRestore, FaBan } from 'react-icons/fa';
import { useMenuPosition } from '../../hooks';

/**
 * Context Menu cho Trash Page
 * Chỉ có 2 hành động chính: Khôi phục và Xóa vĩnh viễn
 * 
 * @param {Object} menuState - { visible, x, y, file }
 * @param {Function} onClose - Callback đóng menu
 * @param {Function} onAction - Callback xử lý action (RESTORE | DELETE_PERMANENT | INFO)
 */
const TrashContextMenu = ({ menuState, onClose, onAction }) => {
    const menuRef = useRef(null);
    const { top, left } = useMenuPosition(menuRef, menuState.x, menuState.y, menuState.visible);

    const file = menuState.file;
    if (!file || !menuState.visible) return null;

    // Lấy quyền từ permissions
    const perms = file.permissions || {
        canRestore: true,
        canDeletePermanently: true,
        canViewDetails: true
    };

    // Config menu cho Trash
    const menuConfig = [
        {
            label: 'Khôi phục',
            action: 'RESTORE',
            icon: <FaTrashRestore className="text-green-600" />,
            show: perms.canRestore,
            className: 'text-green-700 hover:bg-green-50'
        },
        {
            label: 'Xóa vĩnh viễn',
            action: 'DELETE_PERMANENT',
            icon: <FaBan className="text-red-500" />,
            show: perms.canDeletePermanently,
            isDanger: true,
            className: 'text-red-600 hover:bg-red-50 border-t mt-1'
        }
    ];

    const validOptions = menuConfig.filter(opt => opt.show);
    if (validOptions.length === 0) return null;

    return (
        <div
            ref={menuRef}
            className="fixed bg-white border border-gray-200 shadow-xl rounded-lg z-[100] w-56 py-2 animate-fade-in text-sm"
            style={{ top, left, visibility: top === -9999 ? 'hidden' : 'visible' }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="px-4 py-2 border-b bg-gray-50 text-xs font-semibold text-gray-500 truncate select-none">
                {file.name}
            </div>

            {/* Menu Items */}
            <div className="py-1">
                {validOptions.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => onAction(opt.action, file)}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition ${opt.className}`}
                    >
                        <span className="text-base min-w-[20px]">{opt.icon}</span>
                        <span className="font-medium">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TrashContextMenu;