import { useState, useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import fileService from '../services/fileService';
import { getToken } from '../api/axiosClient';

/**
 * =============================================================================
 * USE FILE ACTIONS HOOK (REACT NATIVE VERSION)
 * =============================================================================
 * Hook xử lý TOÀN BỘ hành động với file/folder trên Mobile
 * Đã đồng bộ logic với phiên bản Web
 * =============================================================================
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
    // REFS
    // =========================================================================
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);

    // =========================================================================
    // STATE: CREATE FOLDER MODAL
    // =========================================================================
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // =========================================================================
    // STATE: RENAME MODAL
    // =========================================================================
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameData, setRenameData] = useState({ item: null, newName: '' });

    // =========================================================================
    // STATE: DESCRIPTION MODAL
    // =========================================================================
    const [showDescModal, setShowDescModal] = useState(false);
    const [descData, setDescData] = useState({ item: null, description: '' });

    // =========================================================================
    // STATE: INFO MODAL
    // =========================================================================
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoData, setInfoData] = useState(null);
    const [infoLoading, setInfoLoading] = useState(false);

    // =========================================================================
    // STATE: SHARE MODAL
    // =========================================================================
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareData, setShareData] = useState(null);
    const [shareLoading, setShareLoading] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [permissionInput, setPermissionInput] = useState('VIEWER');

    // =========================================================================
    // STATE: CONFIRM REVOKE MODAL
    // =========================================================================
    const [showConfirmRevokeModal, setShowConfirmRevokeModal] = useState(false);
    const [userToRevoke, setUserToRevoke] = useState(null);
    const [revokeLoading, setRevokeLoading] = useState(false);

    // =========================================================================
    // STATE: MOVE MODAL
    // =========================================================================
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [filesToMove, setFilesToMove] = useState([]);

    // =========================================================================
    // STATE: DELETE MODAL
    // =========================================================================
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [filesToDelete, setFilesToDelete] = useState([]);
    const [deleting, setDeleting] = useState(false);

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    /**
     * Tạo đường dẫn chia sẻ
     */
    const generateShareLink = useCallback((item) => {
        const origin = 'https://securedoc.fun';
        if (item?.type === 'FOLDER') {
            return `${origin}/folders/${item.id}`;
        }
        return `${origin}/file/view/${item?.id}`;
    }, []);

    /**
     * Clear selection an toàn
     */
    const clearSelection = useCallback(() => {
        if (setSelection && typeof setSelection === 'function') {
            setSelection(new Set());
        }
    }, [setSelection]);

    // =========================================================================
    // DOWNLOAD ACTIONS
    // =========================================================================

    const handleDownload = useCallback(async (file) => {
        Toast.show({
            type: 'info',
            text1: 'Đang tải xuống...',
            text2: file.name,
            autoHide: false
        });

        try {
            const token = await getToken();
            if (!token) throw new Error('Chưa đăng nhập');

            const downloadUrl = fileService.getDownloadUrl(file.id);
            const fileUri = FileSystem.documentDirectory + file.name;

            const downloadResult = await FileSystem.downloadAsync(
                downloadUrl,
                fileUri,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            Toast.hide();

            if (downloadResult.status === 200) {
                const isSharingAvailable = await Sharing.isAvailableAsync();
                if (isSharingAvailable) {
                    await Sharing.shareAsync(downloadResult.uri, {
                        mimeType: file.mimeType || 'application/octet-stream',
                        dialogTitle: `Lưu hoặc chia sẻ: ${file.name}`
                    });
                    Toast.show({ type: 'success', text1: 'Tải xuống thành công!' });
                } else {
                    Toast.show({ type: 'success', text1: 'Đã tải file', text2: 'File đã được lưu trong ứng dụng' });
                }
            } else {
                throw new Error(`Tải xuống thất bại (${downloadResult.status})`);
            }
        } catch (error) {
            Toast.hide();
            console.error('Download error:', error);
            Toast.show({ type: 'error', text1: 'Lỗi tải xuống', text2: error.message || 'Vui lòng thử lại' });
        }
    }, []);

    const handleFileClick = useCallback((file) => {
        const mime = file?.mimeType || '';
        const name = file?.name?.toLowerCase() || '';

        const isInternalViewer =
            mime === 'application/pdf' ||
            name.endsWith('.docx') ||
            name.endsWith('.doc');

        const isImage = mime.startsWith('image/');

        if (isInternalViewer || isImage) {
            navigation.navigate('FileViewer', { fileId: file.id, file: file });
        } else {
            handleDownload(file);
        }
    }, [navigation, handleDownload]);

    // =========================================================================
    // RENAME ACTIONS
    // =========================================================================

    const openRenameModal = useCallback((file) => {
        setRenameData({ item: file, newName: file?.name || '' });
        setShowRenameModal(true);
    }, []);

    const closeRenameModal = useCallback(() => {
        setShowRenameModal(false);
        setRenameData({ item: null, newName: '' });
    }, []);

    const submitRename = useCallback(async (newNameOrEvent) => {
        const newName = typeof newNameOrEvent === 'string'
            ? newNameOrEvent
            : renameData.newName;

        if (!newName?.trim() || !renameData.item) return;

        if (contextHandleRename) {
            const success = await contextHandleRename(renameData.item, newName.trim());
            if (success) {
                closeRenameModal();
            }
        }
    }, [renameData, contextHandleRename, closeRenameModal]);

    // =========================================================================
    // DESCRIPTION ACTIONS
    // =========================================================================

    const openDescModal = useCallback((file) => {
        setDescData({ item: file, description: file?.description || '' });
        setShowDescModal(true);
    }, []);

    const closeDescModal = useCallback(() => {
        setShowDescModal(false);
        setDescData({ item: null, description: '' });
    }, []);

    const submitDescription = useCallback(async (descriptionOrEvent) => {
        const description = typeof descriptionOrEvent === 'string'
            ? descriptionOrEvent
            : descData.description;

        if (!descData.item) return;

        if (contextHandleUpdateDescription) {
            const success = await contextHandleUpdateDescription(descData.item, description || '');
            if (success) {
                closeDescModal();
            }
        }
    }, [descData, contextHandleUpdateDescription, closeDescModal]);

    // =========================================================================
    // INFO ACTIONS
    // =========================================================================

    const openInfoModal = useCallback(async (file) => {
        setShowInfoModal(true);
        setInfoLoading(true);
        setInfoData(file);

        try {
            const res = await fileService.getFileDetails(file.id);
            if (res.success || res.data) {
                setInfoData(res.data);
            }
        } catch (error) {
            console.error('Fetch file info error:', error);
            Toast.show({ type: 'error', text1: 'Không thể lấy thông tin file' });
        } finally {
            setInfoLoading(false);
        }
    }, []);

    const closeInfoModal = useCallback(() => {
        setShowInfoModal(false);
        setInfoData(null);
    }, []);

    // =========================================================================
    // SHARE ACTIONS
    // =========================================================================

    const openShareModal = useCallback(async (file) => {
        setShowShareModal(true);
        setShareLoading(true);
        setShareData(file);
        setEmailInput('');
        setPermissionInput('VIEWER');

        try {
            const res = await fileService.getFileDetails(file.id);
            if (res.success || res.data) {
                setShareData(res.data);
            }
        } catch (error) {
            console.error('Fetch share data error:', error);
            Toast.show({ type: 'error', text1: 'Lỗi tải thông tin chia sẻ' });
            setShowShareModal(false);
        } finally {
            setShareLoading(false);
        }
    }, []);

    const closeShareModal = useCallback(() => {
        setShowShareModal(false);
        setShareData(null);
        setEmailInput('');
        setPermissionInput('VIEWER');
    }, []);

    const handleAddUserShare = useCallback(async () => {
        if (!emailInput.trim() || !shareData) return;

        setShareLoading(true);
        try {
            const res = await fileService.shareFile(shareData.id, emailInput.trim(), permissionInput);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Đã chia sẻ thành công!' });
                setEmailInput('');

                const refreshRes = await fileService.getFileDetails(shareData.id);
                if (refreshRes.success || refreshRes.data) {
                    setShareData(refreshRes.data);
                }
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi khi chia sẻ',
                text2: error.response?.data?.message || 'Vui lòng thử lại'
            });
        } finally {
            setShareLoading(false);
        }
    }, [emailInput, permissionInput, shareData]);

    const clickRevoke = useCallback((user) => {
        setUserToRevoke(user);
        setShowConfirmRevokeModal(true);
    }, []);

    const closeConfirmRevokeModal = useCallback(() => {
        setShowConfirmRevokeModal(false);
        setUserToRevoke(null);
    }, []);

    const confirmRevoke = useCallback(async () => {
        if (!userToRevoke || !shareData) return;

        setRevokeLoading(true);
        try {
            const res = await fileService.revokeAccess(shareData.id, userToRevoke.email);
            if (res.success) {
                Toast.show({ type: 'success', text1: `Đã ngừng chia sẻ với ${userToRevoke.email}` });

                setShareData(prev => ({
                    ...prev,
                    sharedWith: prev?.sharedWith?.filter(p => p.user?.email !== userToRevoke.email) || []
                }));

                closeConfirmRevokeModal();
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Không thể gỡ quyền lúc này' });
        } finally {
            setRevokeLoading(false);
        }
    }, [userToRevoke, shareData, closeConfirmRevokeModal]);

    const handleChangePublicAccess = useCallback(async (newAccess) => {
        if (!shareData) return;

        try {
            const res = await fileService.changePublicAccess(shareData.id, newAccess);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Đã cập nhật quyền truy cập chung' });
                setShareData(prev => ({ ...prev, publicAccess: newAccess }));
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi cập nhật quyền' });
        }
    }, [shareData]);

    const handleUpdatePermission = useCallback(async (email, newPermission) => {
        if (!shareData) return;

        try {
            const res = await fileService.shareFile(shareData.id, email, newPermission);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Đã cập nhật quyền thành công' });

                setShareData(prev => ({
                    ...prev,
                    sharedWith: prev?.sharedWith?.map(perm =>
                        perm.user?.email === email
                            ? { ...perm, permissionType: newPermission }
                            : perm
                    ) || []
                }));
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Không thể cập nhật quyền' });
        }
    }, [shareData]);

    const copyShareLink = useCallback(async () => {
        if (!shareData) return;

        const link = generateShareLink(shareData);
        await Clipboard.setStringAsync(link);
        Toast.show({ type: 'success', text1: 'Đã sao chép đường liên kết!' });
    }, [shareData, generateShareLink]);

    // =========================================================================
    // COPY LINK & COPY FILE ACTIONS
    // =========================================================================

    const handleCopyLink = useCallback(async (file) => {
        const link = generateShareLink(file);
        await Clipboard.setStringAsync(link);
        Toast.show({ type: 'success', text1: 'Đã sao chép liên kết!' });
    }, [generateShareLink]);

    const handleCopyFile = useCallback(async (file) => {
        Toast.show({ type: 'info', text1: 'Đang tạo bản sao...' });
        try {
            const res = await fileService.copyFile(file.id);
            if (res.success) {
                Toast.show({ type: 'success', text1: `Đã tạo bản sao: ${res.data?.name || file.name}` });
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi khi tạo bản sao' });
        }
    }, [onRefresh]);

    // =========================================================================
    // MOVE ACTIONS
    // =========================================================================

    const openMoveModal = useCallback((files) => {
        const items = Array.isArray(files) ? files : [files];
        setFilesToMove(items);
        setFilesToDelete(items); // Để tương thích với MoveFileModal dùng filesToDelete
        setShowMoveModal(true);
    }, []);

    const closeMoveModal = useCallback(() => {
        setShowMoveModal(false);
        // KHÔNG clear selection khi đóng modal
    }, []);

    const handleMoveSuccess = useCallback(() => {
        // Clear selection SAU KHI thành công
        clearSelection();
        setFilesToMove([]);
        setFilesToDelete([]);
        setShowMoveModal(false);

        if (onRefresh) {
            onRefresh();
        }
    }, [onRefresh, clearSelection]);

    // =========================================================================
    // DELETE ACTIONS
    // =========================================================================

    const openDeleteModal = useCallback((items) => {
        if (!items || items.length === 0) return;
        setFilesToDelete(Array.isArray(items) ? items : [items]);
        setShowDeleteModal(true);
    }, []);

    const handleSoftDelete = openDeleteModal;

    const closeDeleteModal = useCallback(() => {
        setShowDeleteModal(false);
        // KHÔNG clear selection khi đóng modal
    }, []);

    const executeDelete = useCallback(async () => {
        if (filesToDelete.length === 0) return;

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

            // Clear selection SAU KHI xóa thành công
            clearSelection();
            setFilesToDelete([]);
            setShowDeleteModal(false);

            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi khi xóa file',
                text2: error.response?.data?.message || 'Vui lòng thử lại'
            });
        } finally {
            setDeleting(false);
        }
    }, [filesToDelete, onRefresh, clearSelection]);

    // =========================================================================
    // CREATE FOLDER ACTIONS
    // =========================================================================

    const openCreateFolderModal = useCallback(() => {
        setShowCreateModal(true);
        setNewFolderName('');
    }, []);

    const closeCreateFolderModal = useCallback(() => {
        setShowCreateModal(false);
        setNewFolderName('');
    }, []);

    const submitCreateFolder = useCallback(async (nameOrEvent) => {
        const name = typeof nameOrEvent === 'string' ? nameOrEvent : newFolderName;
        if (!name?.trim()) return;

        if (contextHandleCreateFolder) {
            const success = await contextHandleCreateFolder(name.trim());
            if (success) {
                closeCreateFolderModal();
            }
        }
    }, [newFolderName, contextHandleCreateFolder, closeCreateFolderModal]);

    // =========================================================================
    // UPLOAD ACTIONS
    // =========================================================================

    const triggerFileUpload = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
                multiple: true
            });

            if (!result.canceled && result.assets && contextHandleUploadFile) {
                await contextHandleUploadFile(result.assets);
            }
        } catch (error) {
            console.error('Document picker error:', error);
            Toast.show({ type: 'error', text1: 'Lỗi chọn file' });
        }
    }, [contextHandleUploadFile]);

    const triggerFolderUpload = useCallback(() => {
        Toast.show({
            type: 'info',
            text1: 'Tính năng chưa hỗ trợ',
            text2: 'Mobile chưa hỗ trợ upload thư mục'
        });
    }, []);

    const onFileSelect = useCallback(async (files) => {
        if (!files || files.length === 0) return;
        const allFiles = Array.isArray(files) ? files : Array.from(files);

        if (allFiles.length > 0 && contextHandleUploadFile) {
            await contextHandleUploadFile(allFiles);
        }
    }, [contextHandleUploadFile]);

    const onFolderSelect = useCallback(async (files) => {
        if (!files || files.length === 0) return;
        if (contextHandleUploadFolder) {
            await contextHandleUploadFolder(Array.from(files));
        }
    }, [contextHandleUploadFolder]);

    // =========================================================================
    // RETRY ACTION
    // =========================================================================

    const handleRetry = useCallback(async (file, setFiles) => {
        Toast.show({ type: 'info', text1: 'Đang thử xử lý lại...' });

        try {
            const res = await fileService.retryFile(file.id);
            if (res.success) {
                if (setFiles) {
                    setFiles(prev => prev.map(f =>
                        f.id === file.id ? { ...f, status: 'PROCESSING' } : f
                    ));
                }
                Toast.show({ type: 'success', text1: 'Đã gửi yêu cầu xử lý lại' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Không thể thử lại' });
        }
    }, []);

    // =========================================================================
    // MENU ACTION HANDLERS
    // =========================================================================

    const handleMenuAction = useCallback((action, file, closeAllMenus) => {
        if (closeAllMenus) closeAllMenus();

        switch (action) {
            case 'OPEN':
                if (file.type === 'FOLDER') {
                    navigation.push('FolderDetail', { folderId: file.id, folderName: file.name });
                } else {
                    handleFileClick(file);
                }
                break;
            case 'DOWNLOAD':
                handleDownload(file);
                break;
            case 'RENAME':
                openRenameModal(file);
                break;
            case 'UPDATE_DESC':
                openDescModal(file);
                break;
            case 'SHARE':
                openShareModal(file);
                break;
            case 'COPY_LINK':
                handleCopyLink(file);
                break;
            case 'MOVE':
                openMoveModal(file);
                break;
            case 'INFO':
                openInfoModal(file);
                break;
            case 'TRASH':
            case 'DELETE':
                handleSoftDelete([file]);
                break;
            case 'COPY':
                handleCopyFile(file);
                break;
            case 'RETRY':
                handleRetry(file);
                break;
            default:
                break;
        }
    }, [
        navigation, handleFileClick, handleDownload, openRenameModal,
        openDescModal, openShareModal, handleCopyLink, openMoveModal,
        openInfoModal, handleSoftDelete, handleCopyFile, handleRetry
    ]);

    const handleBackgroundMenuAction = useCallback((action, closeMenu) => {
        if (closeMenu) closeMenu();

        switch (action) {
            case 'CREATE_FOLDER':
                openCreateFolderModal();
                break;
            case 'UPLOAD_FILE':
                triggerFileUpload();
                break;
            case 'UPLOAD_FOLDER':
                triggerFolderUpload();
                break;
            default:
                break;
        }
    }, [openCreateFolderModal, triggerFileUpload, triggerFolderUpload]);

    // =========================================================================
    // RETURN
    // =========================================================================

    return {
        // Refs
        fileInputRef,
        folderInputRef,

        // Create Folder Modal
        showCreateModal,
        newFolderName,
        setNewFolderName,
        openCreateFolderModal,
        closeCreateFolderModal,
        submitCreateFolder,

        // Rename Modal
        showRenameModal,
        renameData,
        setRenameData,
        openRenameModal,
        closeRenameModal,
        submitRename,

        // Description Modal
        showDescModal,
        descData,
        setDescData,
        openDescModal,
        closeDescModal,
        submitDescription,

        // Info Modal
        showInfoModal,
        infoData,
        infoLoading,
        openInfoModal,
        closeInfoModal,

        // Share Modal
        showShareModal,
        shareData,
        shareLoading,
        emailInput,
        setEmailInput,
        permissionInput,
        setPermissionInput,
        openShareModal,
        closeShareModal,
        handleAddUserShare,
        handleChangePublicAccess,
        handleUpdatePermission,
        copyShareLink,

        // Confirm Revoke Modal
        showConfirmRevokeModal,
        userToRevoke,
        revokeLoading,
        clickRevoke,
        confirmRevoke,
        closeConfirmRevokeModal,

        // Move Modal
        showMoveModal,
        filesToMove,
        openMoveModal,
        closeMoveModal,
        handleMoveSuccess,

        // Delete Modal
        showDeleteModal,
        filesToDelete,
        deleting,
        handleSoftDelete,
        openDeleteModal,
        closeDeleteModal,
        executeDelete,

        // Individual Actions
        handleDownload,
        handleFileClick,
        handleCopyLink,
        handleCopyFile,
        handleRetry,

        // Upload Actions
        triggerFileUpload,
        triggerFolderUpload,
        onFileSelect,
        onFolderSelect,

        // Menu Handlers
        handleMenuAction,
        handleBackgroundMenuAction,

        // Helpers
        generateShareLink,
        clearSelection
    };
};

export default useFileActions;