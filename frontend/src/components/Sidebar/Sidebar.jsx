import React, { useState, useContext, useRef, useEffect } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';

// Context
import { FileContext } from '../../context/FileContext';

// Components
import UploadDropdown from './UploadDropdown';
import SidebarNav from './SidebarNav';
import SidebarLogo from './SidebarLogo';
import { CreateFolderModal } from '../Dashboard';

// Hooks
import { useUploadPermissions, useFileActions } from '../../hooks';

/**
 * Sidebar chính của ứng dụng
 * [REFACTORED] Sử dụng useFileActions để tái sử dụng logic
 */
const Sidebar = () => {
    // 1. Context
    const {
        handleCreateFolder,
        handleUploadFile,
        handleUploadFolder,
        currentPermissions
    } = useContext(FileContext);

    // 2. Hooks Permissions
    const permissions = useUploadPermissions(currentPermissions);

    // 3. INIT HOOK useFileActions
    // Truyền các hàm xử lý từ Context vào Hook để Hook gọi khi cần
    const fileActions = useFileActions({
        handleCreateFolder,
        handleUploadFile,
        handleUploadFolder
    });

    // 4. Local UI State (Chỉ giữ lại state liên quan đến giao diện Sidebar)
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const menuRef = useRef(null);

    // Đóng menu khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUploadMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // === HANDLERS UI ===

    const toggleUploadMenu = () => {
        if (permissions.canDoAnything) {
            setShowUploadMenu(prev => !prev);
        }
    };

    /**
     * Helper: Thực hiện hành động từ hook và đóng menu dropdown
     */
    const handleAction = (actionFn) => {
        if (actionFn) actionFn();
        setShowUploadMenu(false);
    };

    return (
        <>
            <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col transition-all duration-300">
                {/* Logo */}
                <SidebarLogo />

                {/* Upload Section */}
                <div className="p-4 relative" ref={menuRef}>
                    {/* Upload Button */}
                    <UploadButton
                        onClick={toggleUploadMenu}
                        disabled={!permissions.canDoAnything}
                    />

                    {/* Dropdown Menu */}
                    {showUploadMenu && permissions.canDoAnything && (
                        <UploadDropdown
                            permissions={permissions}
                            // Kết nối các hành động từ Hook thông qua hàm wrapper để đóng menu
                            onCreateFolder={() => handleAction(fileActions.openCreateFolderModal)}
                            onUploadFile={() => handleAction(fileActions.triggerFileUpload)}
                            onUploadFolder={() => handleAction(fileActions.triggerFolderUpload)}
                        />
                    )}

                    {/* HIDDEN INPUTS - Sử dụng Refs và Handlers trực tiếp từ Hook */}
                    {/* Input Upload File */}
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileActions.fileInputRef}
                        onChange={fileActions.onFileSelect}
                        // Không có 'accept' -> Cho phép mọi loại file
                    />
                    
                    {/* Input Upload Folder */}
                    <input
                        type="file"
                        className="hidden"
                        ref={fileActions.folderInputRef}
                        onChange={fileActions.onFolderSelect}
                        webkitdirectory=""
                        directory=""
                        multiple
                    />
                </div>

                {/* Navigation */}
                <SidebarNav />
            </aside>

            {/* Create Folder Modal - Sử dụng State và Handlers từ Hook */}
            <CreateFolderModal
                isOpen={fileActions.showCreateModal}
                onClose={fileActions.closeCreateFolderModal}
                onSubmit={(name) => {
                    // Cập nhật state name trong hook trước khi submit
                    fileActions.setNewFolderName(name);
                    fileActions.submitCreateFolder({ preventDefault: () => { } });
                }}
                value={fileActions.newFolderName}
                onChange={fileActions.setNewFolderName}
            />
        </>
    );
};

/**
 * Nút Upload chính
 */
const UploadButton = ({ onClick, disabled }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 
                font-medium transition shadow-lg
                ${disabled
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                }
            `}
        >
            <FaCloudUploadAlt size={20} />
            <span>Tải lên mới</span>
        </button>
    );
};

export default Sidebar;