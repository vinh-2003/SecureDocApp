import React, { useState, useContext, useRef, useEffect } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';

// Context
import { FileContext } from '../../context/FileContext';

// Components - Import từ cùng folder
import UploadDropdown from './UploadDropdown';
import SidebarNav from './SidebarNav';
import SidebarLogo from './SidebarLogo';
import { CreateFolderModal } from '../Dashboard';

// Hooks
import { useUploadPermissions, useFileValidation } from '../../hooks';

// Constants
import { FILE_ACCEPT } from '../../constants';

/**
 * Sidebar chính của ứng dụng
 */
const Sidebar = () => {
    // Context
    const {
        handleCreateFolder,
        handleUploadFile,
        handleUploadFolder,
        currentPermissions
    } = useContext(FileContext);

    // Hooks
    const permissions = useUploadPermissions(currentPermissions);
    const { validateFiles } = useFileValidation();

    // State
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Refs
    const menuRef = useRef(null);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);

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

    // === HANDLERS ===

    const toggleUploadMenu = () => {
        if (permissions.canDoAnything) {
            setShowUploadMenu(prev => !prev);
        }
    };

    const openCreateFolderModal = () => {
        setShowCreateModal(true);
        setShowUploadMenu(false);
    };

    const submitCreateFolder = async (e) => {
        // e.preventDefault();
        if (!newFolderName.trim()) return;

        const success = await handleCreateFolder(newFolderName);
        if (success) {
            setShowCreateModal(false);
            setNewFolderName('');
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const triggerFolderInput = () => {
        folderInputRef.current?.click();
    };

    const handleFileSelect = async (e) => {
        const rawFiles = e.target.files;
        if (!rawFiles?.length) return;

        const validFiles = validateFiles(rawFiles, { context: 'file' });

        if (validFiles.length > 0) {
            await handleUploadFile(validFiles);
        }

        e.target.value = null;
        setShowUploadMenu(false);
    };

    const handleFolderSelect = async (e) => {
        const rawFiles = e.target.files;
        if (!rawFiles?.length) return;

        const validFiles = validateFiles(rawFiles, { context: 'folder' });

        if (validFiles.length > 0) {
            await handleUploadFolder(validFiles);
        }

        e.target.value = null;
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
                            onCreateFolder={openCreateFolderModal}
                            onUploadFile={triggerFileInput}
                            onUploadFolder={triggerFolderInput}
                        />
                    )}

                    {/* Hidden Inputs */}
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept={FILE_ACCEPT}
                    />
                    <input
                        type="file"
                        className="hidden"
                        ref={folderInputRef}
                        onChange={handleFolderSelect}
                        webkitdirectory=""
                        directory=""
                        multiple
                    />
                </div>

                {/* Navigation */}
                <SidebarNav />
            </aside>

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={submitCreateFolder}
                value={newFolderName}
                onChange={setNewFolderName}
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