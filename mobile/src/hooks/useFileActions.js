import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';

import fileService from '../services/fileService';

/**
 * Hook xử lý TOÀN BỘ hành động với file/folder trên Mobile
 * Tương thích logic với DashboardScreen
 */
const useFileActions = (options = {}) => {
    const {
        onRefresh,
        setSelection,
        handleRename: contextHandleRename,
        handleUpdateDescription: contextHandleUpdateDescription,
        handleUploadFile: contextHandleUploadFile,
        handleCreateFolder: contextHandleCreateFolder,
        handleUploadFolder: contextHandleUploadFolder
    } = options;

    const navigation = useNavigation();

    // =========================================================================
    // 1. STATE QUẢN LÝ MODALS
    // =========================================================================

    // Create Folder
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Rename
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [fileToRename, setFileToRename] = useState(null);
    // State dùng cho binding 2 chiều ở modal (giống web)
    const [renameData, setRenameData] = useState({ item: null, newName: '' }); 

    // Description
    const [showDescModal, setShowDescModal] = useState(false);
    const [descData, setDescData] = useState({ item: null, description: '' });

    // Info
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoData, setInfoData] = useState(null);
    const [infoLoading, setInfoLoading] = useState(false);

    // Delete
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [filesToDelete, setFilesToDelete] = useState([]);
    const [deleting, setDeleting] = useState(false);

    // Move
    const [showMoveModal, setShowMoveModal] = useState(false);

    // Share
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareData, setShareData] = useState(null);
    const [shareLoading, setShareLoading] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [permissionInput, setPermissionInput] = useState('VIEWER');

    // Revoke
    const [showConfirmRevokeModal, setShowConfirmRevokeModal] = useState(false);
    const [userToRevoke, setUserToRevoke] = useState(null);
    const [revokeLoading, setRevokeLoading] = useState(false);

    // =========================================================================
    // 2. ACTION HANDLERS
    // =========================================================================

    const generateShareLink = useCallback((item) => {
        const origin = 'https://securedoc.fun'; 
        if (item.type === 'FOLDER') {
            return `${origin}/folders/${item.id}`;
        } else {
            return `${origin}/file/view/${item.id}`;
        }
    }, []);

    // --- A. DOWNLOAD ---
    const handleDownload = async (file) => {
        Toast.show({ type: 'info', text1: 'Đang tải xuống...', text2: file.name });
        try {
            await fileService.downloadFile(file.id);
            Toast.show({ type: 'success', text1: 'Đã gửi yêu cầu tải xuống' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi tải xuống', text2: error.message });
        }
    };

    // --- B. RENAME ---
    const openRenameModal = (file) => {
        setRenameData({ item: file, newName: file.name });
        setFileToRename(file); // Giữ state cũ nếu logic cũ dùng
        setShowRenameModal(true);
    };

    // [FIX] Bổ sung hàm closeRenameModal
    const closeRenameModal = () => {
        setShowRenameModal(false);
        setFileToRename(null);
        setRenameData({ item: null, newName: '' });
    };

    const submitRename = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        
        // Ưu tiên dùng data từ renameData (để tương thích input onChange)
        const targetFile = renameData.item || fileToRename;
        const targetName = renameData.newName;

        if (contextHandleRename && targetFile) {
            const success = await contextHandleRename(targetFile, targetName);
            if (success) {
                closeRenameModal();
            }
        }
    };

    // --- C. CREATE FOLDER ---
    const openCreateFolderModal = () => {
        setNewFolderName('');
        setShowCreateModal(true);
    };

    const closeCreateFolderModal = () => {
        setShowCreateModal(false);
        setNewFolderName('');
    };

    const submitCreateFolder = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!newFolderName.trim()) return;
        
        if (contextHandleCreateFolder) {
            const success = await contextHandleCreateFolder(newFolderName);
            if (success) closeCreateFolderModal();
        }
    };

    // --- D. DESCRIPTION ---
    const openDescModal = (file) => {
        setDescData({ item: file, description: file.description || '' });
        setShowDescModal(true);
    };

    const closeDescModal = () => {
        setShowDescModal(false);
        setDescData({ item: null, description: '' });
    };

    const submitDescription = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (contextHandleUpdateDescription && descData.item) {
            const success = await contextHandleUpdateDescription(descData.item, descData.description);
            if (success) {
                if (infoData && infoData.id === descData.item.id) {
                    setInfoData(prev => ({ ...prev, description: descData.description }));
                }
                closeDescModal();
            }
        }
    };

    // --- E. INFO ---
    const openInfoModal = (file) => {
        setInfoData(file);
        setShowInfoModal(true);
        fetchFileInfo(file.id);
    };

    const fetchFileInfo = async (id) => {
        setInfoLoading(true);
        try {
            const res = await fileService.getFileDetails(id);
            if (res.data) setInfoData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setInfoLoading(false);
        }
    };

    // [FIX] Bổ sung hàm closeInfoModal
    const closeInfoModal = () => {
        setShowInfoModal(false);
        setInfoData(null);
    };

    // --- F. DELETE ---
    const openDeleteModal = (items) => {
        const files = Array.isArray(items) ? items : [items];
        setFilesToDelete(files);
        setShowDeleteModal(true);
    };

    // [FIX] Bổ sung hàm closeDeleteModal
    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setFilesToDelete([]);
    };

    const executeDelete = async () => {
        setDeleting(true);
        try {
            const ids = filesToDelete.map(f => f.id);
            const isTrash = filesToDelete[0]?.deletedAt;

            if (isTrash) {
                await fileService.deletePermanently(ids);
                Toast.show({ type: 'success', text1: 'Đã xóa vĩnh viễn' });
            } else {
                await fileService.moveToTrash(ids);
                Toast.show({ type: 'success', text1: 'Đã chuyển vào thùng rác' });
            }
            closeDeleteModal();
            if (setSelection) setSelection(new Set());
            if (onRefresh) onRefresh();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi xóa file' });
        } finally {
            setDeleting(false);
        }
    };

    // --- G. MOVE ---
    const openMoveModal = (items) => {
        const files = Array.isArray(items) ? items : [items];
        setFilesToDelete(files); 
        setShowMoveModal(true);
    };

    const closeMoveModal = () => {
        setShowMoveModal(false);
        setFilesToDelete([]);
    };

    const handleMoveSuccess = () => {
        closeMoveModal();
        if (setSelection) setSelection(new Set());
        if (onRefresh) onRefresh();
    };

    // --- H. SHARE (Đã fix lỗi ReferenceError) ---
    const openShareModal = (file) => {
        setShareData(file);
        setShowShareModal(true);
        fetchFileInfo(file.id).then(res => {}); 
    };

    // [FIX] Định nghĩa hàm closeShareModal
    const closeShareModal = () => {
        setShowShareModal(false);
        setShareData(null);
        setEmailInput('');
        setPermissionInput('VIEWER');
    };

    const handleAddUserShare = async () => {
        if (!emailInput) return;
        setShareLoading(true);
        try {
            await fileService.shareFile(shareData.id, emailInput, permissionInput);
            Toast.show({ type: 'success', text1: `Đã chia sẻ với ${emailInput}` });
            setEmailInput('');
            const res = await fileService.getFileDetails(shareData.id);
            if(res.data) setShareData(res.data);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi chia sẻ', text2: error.response?.data?.message });
        } finally {
            setShareLoading(false);
        }
    };

    const clickRevoke = (user) => {
        setUserToRevoke(user);
        setShowConfirmRevokeModal(true);
    };

    // [FIX] Định nghĩa hàm closeConfirmRevokeModal
    const closeConfirmRevokeModal = () => {
        setShowConfirmRevokeModal(false);
        setUserToRevoke(null);
    };

    const confirmRevoke = async () => {
        if (!userToRevoke || !shareData) return;
        setRevokeLoading(true);
        try {
            await fileService.revokeAccess(shareData.id, userToRevoke.email);
            Toast.show({ type: 'success', text1: `Đã gỡ quyền của ${userToRevoke.email}` });
            
            setShareData(prev => ({
                ...prev,
                sharedWith: prev.sharedWith.filter(p => p.user.email !== userToRevoke.email)
            }));
            closeConfirmRevokeModal();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi gỡ quyền' });
        } finally {
            setRevokeLoading(false);
        }
    };

    const handleUpdatePermission = async (email, newPermission) => {
        try {
            await fileService.shareFile(shareData.id, email, newPermission);
            Toast.show({ type: 'success', text1: 'Đã cập nhật quyền' });
             setShareData(prev => ({
                ...prev,
                sharedWith: prev.sharedWith.map(p => 
                    p.user.email === email ? { ...p, permissionType: newPermission } : p
                )
            }));
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi cập nhật' });
        }
    };

    const handleChangePublicAccess = async (newAccess) => {
        try {
            await fileService.changePublicAccess(shareData.id, newAccess);
            Toast.show({ type: 'success', text1: 'Đã đổi quyền truy cập chung' });
            setShareData(prev => ({ ...prev, publicAccess: newAccess }));
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi cập nhật' });
        }
    };

    // --- I. COPY & LINK ---
    const handleCopyFile = async (file) => {
        try {
            await fileService.copyFile(file.id);
            Toast.show({ type: 'success', text1: 'Đã tạo bản sao' });
            if (onRefresh) onRefresh();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi sao chép' });
        }
    };

    const handleCopyLink = async (file) => {
        const link = generateShareLink(file);
        await Clipboard.setStringAsync(link);
        Toast.show({ type: 'success', text1: 'Đã sao chép liên kết' });
    };

    // --- J. RETRY ---
    const handleRetry = async (file) => {
        try {
            await fileService.retryFile(file.id);
            Toast.show({ type: 'success', text1: 'Đã yêu cầu xử lý lại' });
            if (onRefresh) onRefresh();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Không thể thử lại' });
        }
    };

    // --- K. UPLOAD ---
    const triggerFileUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
                multiple: true
            });
            if (!result.canceled && result.assets && contextHandleUploadFile) {
                await contextHandleUploadFile(result.assets);
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Lỗi chọn file' });
        }
    };

    const triggerFolderUpload = () => {
        Toast.show({ type: 'info', text1: 'Mobile chưa hỗ trợ upload thư mục' });
    };

    // =========================================================================
    // 3. MENU HANDLERS
    // =========================================================================

    const handleMenuAction = (action, file) => {
        switch (action) {
            case 'OPEN':
                if (file.type === 'FOLDER') {
                    navigation.push('FolderDetail', { folderId: file.id, folderName: file.name });
                } else {
                    navigation.navigate('FileViewer', { fileId: file.id, file: file });
                }
                break;
            case 'DOWNLOAD': handleDownload(file); break;
            case 'RENAME': openRenameModal(file); break;
            case 'UPDATE_DESC': openDescModal(file); break;
            case 'MOVE': openMoveModal(file); break;
            case 'COPY': handleCopyFile(file); break;
            case 'SHARE': openShareModal(file); break;
            case 'INFO': openInfoModal(file); break;
            case 'DELETE': 
            case 'TRASH': openDeleteModal(file); break;
            case 'COPY_LINK': handleCopyLink(file); break;
            case 'RETRY': handleRetry(file); break;
            default: break;
        }
    };

    const handleBackgroundMenuAction = (action) => {
        switch (action) {
            case 'CREATE_FOLDER': openCreateFolderModal(); break;
            case 'UPLOAD_FILE': triggerFileUpload(); break;
            case 'UPLOAD_FOLDER': triggerFolderUpload(); break;
            default: break;
        }
    };

    return {
        // --- STATES ---
        // Create Folder
        showCreateModal, setShowCreateModal, newFolderName, setNewFolderName,
        
        // Rename
        showRenameModal, setShowRenameModal, fileToRename, renameData, setRenameData,

        // Description
        showDescModal, setShowDescModal, descData, setDescData,

        // Delete & Move
        showDeleteModal, setShowDeleteModal, filesToDelete, deleting,
        showMoveModal, setShowMoveModal,

        // Info
        showInfoModal, setShowInfoModal, infoData, infoLoading,

        // Share
        showShareModal, setShowShareModal, shareData, shareLoading,
        emailInput, setEmailInput, permissionInput, setPermissionInput,
        showConfirmRevokeModal, setShowConfirmRevokeModal, userToRevoke, revokeLoading,

        // --- HANDLERS (Open/Close Modals) ---
        openCreateFolderModal, closeCreateFolderModal,
        openRenameModal, closeRenameModal,
        openDescModal, closeDescModal,
        openDeleteModal, closeDeleteModal,
        openMoveModal, closeMoveModal,
        openInfoModal, closeInfoModal,
        openShareModal, closeShareModal,
        clickRevoke, closeConfirmRevokeModal,

        // --- HANDLERS (Executors) ---
        submitCreateFolder,
        submitRename,
        submitDescription,
        executeDelete,
        handleMoveSuccess,
        
        handleAddUserShare,
        confirmRevoke,
        handleUpdatePermission,
        handleChangePublicAccess,

        handleDownload,
        handleCopyFile,
        handleCopyLink,
        handleRetry,
        
        triggerFileUpload,
        triggerFolderUpload,

        handleMenuAction,
        handleBackgroundMenuAction,
        generateShareLink
    };
};

export default useFileActions;