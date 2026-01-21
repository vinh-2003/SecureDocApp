import React from 'react';
import { FaFolderPlus, FaFileUpload, FaFolderOpen } from 'react-icons/fa';

/**
 * Dropdown menu cho các tùy chọn upload
 * 
 * @param {Object} permissions - Quyền upload
 * @param {Function} onCreateFolder - Callback tạo folder
 * @param {Function} onUploadFile - Callback upload file
 * @param {Function} onUploadFolder - Callback upload folder
 */
const UploadDropdown = ({
    permissions,
    onCreateFolder,
    onUploadFile,
    onUploadFolder
}) => {
    const menuItems = [
        {
            label: 'Thư mục mới',
            icon: FaFolderPlus,
            iconColor: 'text-yellow-500',
            onClick: onCreateFolder,
            canDo: permissions.canCreateFolder,
            hasBorderTop: false
        },
        {
            label: 'Tải tệp lên',
            icon: FaFileUpload,
            iconColor: 'text-blue-500',
            onClick: onUploadFile,
            canDo: permissions.canUploadFile,
            hasBorderTop: true
        },
        {
            label: 'Tải thư mục lên',
            icon: FaFolderOpen,
            iconColor: 'text-gray-500',
            onClick: onUploadFolder,
            canDo: permissions.canUploadFolder,
            hasBorderTop: true
        }
    ];

    return (
        <div className="absolute left-4 right-4 top-16 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in overflow-hidden">
            {menuItems.map((item, index) => (
                <DropdownItem
                    key={index}
                    label={item.label}
                    icon={item.icon}
                    iconColor={item.iconColor}
                    onClick={item.onClick}
                    canDo={item.canDo}
                    hasBorderTop={item.hasBorderTop}
                />
            ))}
        </div>
    );
};

/**
 * Item trong dropdown
 */
const DropdownItem = ({
    label,
    icon: Icon,
    iconColor,
    onClick,
    canDo,
    hasBorderTop
}) => {
    return (
        <button
            onClick={() => canDo && onClick()}
            disabled={!canDo}
            className={`
                w-full text-left px-4 py-3 flex items-center gap-3 transition
                ${hasBorderTop ? 'border-t border-gray-100' : ''}
                ${canDo
                    ? 'hover:bg-gray-100 cursor-pointer text-gray-800'
                    : 'text-gray-400 cursor-not-allowed bg-gray-50'
                }
            `}
            title={!canDo ? "Bạn không có quyền thực hiện hành động này" : ""}
        >
            <Icon className={canDo ? iconColor : 'text-gray-400 opacity-50'} />
            <span>{label}</span>
        </button>
    );
};

export default UploadDropdown;