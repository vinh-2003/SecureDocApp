import React, { useRef } from 'react';
import { 
    FaDownload, FaPen, FaArrowsAlt, FaClone, 
    FaShareAlt, FaLink, FaInfoCircle, FaTrashRestore, FaTrash 
} from 'react-icons/fa';
import { useMenuPosition } from '../../hooks/useMenuPosition'; // Đảm bảo đường dẫn hook đúng

const ItemContextMenu = ({ menuState, onClose, onAction }) => {
    const menuRef = useRef(null);
    // Tính toán vị trí tự động để không bị tràn màn hình
    const { top, left } = useMenuPosition(menuRef, menuState.x, menuState.y, menuState.visible);

    const file = menuState.file;
    if (!file || !menuState.visible) return null;

    // 1. Lấy quyền từ object permissions (Fallback về false)
    const perms = file.permissions || {
        canDownload: false,
        canRename: false,
        canUpdateDescription: false,
        canMove: false,
        canCopy: false,
        canShare: false,
        canDelete: false,
        canRestore: false,
        canViewDetails: true,
        canCopyLink: true
    };

    // 2. Config Menu
    const menuConfig = [
        // Nhóm Tải
        { label: 'Tải xuống', action: 'DOWNLOAD', icon: <FaDownload className="text-blue-500"/>, show: perms.canDownload },
        
        // Nhóm Sửa đổi
        { label: 'Đổi tên', action: 'RENAME', icon: <FaPen className="text-gray-500"/>, show: perms.canRename },
        { label: 'Di chuyển', action: 'MOVE', icon: <FaArrowsAlt className="text-gray-600"/>, show: perms.canMove },
        { label: 'Tạo bản sao', action: 'COPY', icon: <FaClone className="text-purple-500"/>, show: perms.canCopy },
        
        // Nhóm Chia sẻ
        { label: 'Chia sẻ', action: 'SHARE', icon: <FaShareAlt className="text-blue-600"/>, show: perms.canShare },
        { label: 'Sao chép liên kết', action: 'COPY_LINK', icon: <FaLink className="text-gray-600"/>, show: perms.canCopyLink },
        
        // Nhóm Khác
        { label: 'Cập nhật mô tả', action: 'UPDATE_DESC', icon: <FaInfoCircle className="text-gray-500"/>, show: perms.canUpdateDescription },
        { label: 'Thông tin chi tiết', action: 'INFO', icon: <FaInfoCircle className="text-blue-400"/>, show: perms.canViewDetails },
        
        // Nhóm Thùng rác
        { label: 'Khôi phục', action: 'RESTORE', icon: <FaTrashRestore className="text-green-600"/>, show: perms.canRestore },
        { label: 'Chuyển vào thùng rác', action: 'TRASH', icon: <FaTrash className="text-red-500"/>, isDanger: true, show: perms.canDelete }
    ];

    const validOptions = menuConfig.filter(opt => opt.show);
    if (validOptions.length === 0) return null;

    return (
        <div 
            ref={menuRef}
            className="fixed bg-white border border-gray-200 shadow-xl rounded-lg z-[100] w-64 py-2 animate-fade-in text-sm"
            style={{ 
                top: top, 
                left: left,
                visibility: top === -9999 ? 'hidden' : 'visible' 
            }}
            onClick={(e) => e.stopPropagation()}
        >
             <div className="px-4 py-2 border-b bg-gray-50 text-xs font-semibold text-gray-500 truncate select-none">
                {file.name}
             </div>
             <div className="py-1">
                 {validOptions.map((opt, idx) => (
                    <button 
                        key={idx}
                        onClick={() => onAction(opt.action, file)}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 transition
                            ${opt.isDanger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
                            ${opt.action === 'TRASH' ? 'border-t mt-1' : ''}
                        `}
                    >
                        <span className="text-base min-w-[20px]">{opt.icon}</span>
                        <span>{opt.label}</span>
                    </button>
                 ))}
             </div>
        </div>
    );
};

export default ItemContextMenu;