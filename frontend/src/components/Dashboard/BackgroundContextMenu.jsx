import React, { useRef } from 'react';
import { FaFolderPlus, FaFileUpload, FaFolderOpen } from 'react-icons/fa';
import { useMenuPosition } from '../../hooks';

/**
 * Component hiển thị Menu chuột phải ở vùng trống (Background)
 * 
 * @param {Object} menuState - Trạng thái của menu { visible, x, y }
 * @param {Function} onClose - Callback khi đóng menu
 * @param {Function} onAction - Callback khi chọn action ('CREATE_FOLDER', 'UPLOAD_FILE', 'UPLOAD_FOLDER')
 * @param {Object} permissions - Quyền của user { canCreateFolder, canUploadFile, canUploadFolder }
 */
const BackgroundContextMenu = ({ menuState, onClose, onAction, permissions }) => {
    const menuRef = useRef(null);
    const { top, left } = useMenuPosition(menuRef, menuState.x, menuState.y, menuState.visible);

    if (!menuState.visible) return null;

    // Fallback nếu chưa load xong permissions
    const perms = permissions || { canCreateFolder: false, canUploadFile: false, canUploadFolder: false };

    // Helper render button item
    const renderMenuItem = (label, action, icon, canDo, isBorderTop = false) => {
        return (
            <button
                onClick={() => {
                    if (canDo) onAction(action);
                }}
                disabled={!canDo}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition
                    ${isBorderTop ? 'border-t' : ''}
                    ${canDo
                        ? 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                        : 'text-gray-400 cursor-not-allowed bg-gray-50'
                    }
                `}
                title={!canDo ? "Bạn không có quyền thực hiện hành động này" : ""}
            >
                <span className={canDo ? "" : "opacity-50"}>{icon}</span>
                <span>{label}</span>
            </button>
        );
    };

    return (
        <div
            ref={menuRef}
            className="fixed bg-white border border-gray-200 shadow-xl rounded-lg z-50 w-52 overflow-hidden animate-fade-in"
            style={{ top, left, visibility: top === -9999 ? 'hidden' : 'visible' }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-50 border-b">
                Tùy chọn thư mục
            </div>

            {/* Tạo thư mục mới */}
            {renderMenuItem(
                'Thư mục mới',
                'CREATE_FOLDER',
                <FaFolderPlus className={perms.canCreateFolder ? "text-yellow-500" : "text-gray-400"} />,
                perms.canCreateFolder
            )}

            {/* Tải tệp lên */}
            {renderMenuItem(
                'Tải tệp lên',
                'UPLOAD_FILE',
                <FaFileUpload className={perms.canUploadFile ? "text-blue-500" : "text-gray-400"} />,
                perms.canUploadFile
            )}

            {/* Tải thư mục lên */}
            {renderMenuItem(
                'Tải thư mục lên',
                'UPLOAD_FOLDER',
                <FaFolderOpen className={perms.canUploadFolder ? "text-gray-500" : "text-gray-400"} />,
                perms.canUploadFolder,
                true // border-top
            )}
        </div>
    );
};

export default BackgroundContextMenu;