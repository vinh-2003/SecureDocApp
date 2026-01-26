import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import fileService from '../services/fileService';

/**
 * Hook xử lý các hành động với file/folder
 * Bao gồm:  Download, Rename, Move, Copy, Share, Info, Delete, Upload... 
 * 
 * @param {Object} options - Các callback và config
 * @param {Function} options.onRefresh - Callback refresh danh sách file
 * @param {Function} options.setSelection - Callback set danh sách file được chọn
 * @param {Function} options.handleRename - Callback xử lý rename từ Context
 * @param {Function} options.handleUpdateDescription - Callback xử lý update description từ Context
 * @param {Function} options.handleUploadFile - Callback xử lý upload file từ Context
 * @param {Function} options.handleUploadFolder - Callback xử lý upload folder từ Context
 * @param {Function} options.handleCreateFolder - Callback xử lý tạo folder từ Context
 * 
 * @returns {Object} - States và handlers
 */
const useFileActions = (options = {}) => {
    const {
        onRefresh,
        setSelection,
        handleRename: contextHandleRename,
        handleUpdateDescription: contextHandleUpdateDescription,
        handleUploadFile: contextHandleUploadFile,
        handleUploadFolder: contextHandleUploadFolder,
        handleCreateFolder: contextHandleCreateFolder
    } = options;

    const navigate = useNavigate();

    // ========== REFS ==========
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const renameInputRef = useRef(null);
    const descInputRef = useRef(null);

    // ========== MODAL STATES ==========
    // Modal tạo folder
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Modal đổi tên
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameData, setRenameData] = useState({ item: null, newName: '' });

    // Modal cập nhật mô tả
    const [showDescModal, setShowDescModal] = useState(false);
    const [descData, setDescData] = useState({ item: null, description: '' });

    // Modal thông tin chi tiết
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoData, setInfoData] = useState(null);
    const [infoLoading, setInfoLoading] = useState(false);

    // Modal chia sẻ
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareData, setShareData] = useState(null);
    const [shareLoading, setShareLoading] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [permissionInput, setPermissionInput] = useState('VIEWER');

    // Modal xác nhận xóa quyền
    const [showConfirmRevokeModal, setShowConfirmRevokeModal] = useState(false);
    const [userToRevoke, setUserToRevoke] = useState(null);
    const [revokeLoading, setRevokeLoading] = useState(false);

    // Modal di chuyển
    const [showMoveModal, setShowMoveModal] = useState(false);

    // Modal xóa
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [filesToDelete, setFilesToDelete] = useState([]);
    const [deleting, setDeleting] = useState(false);

    // ========== HELPER FUNCTIONS ==========

    /**
     * Tạo đường dẫn chia sẻ
     */
    const generateShareLink = useCallback((item) => {
        const origin = window.location.origin;
        if (item.type === 'FOLDER') {
            return `${origin}/folders/${item.id}`;
        } else {
            return `${origin}/file/view/${item.id}`;
        }
    }, []);

    // ========== DOWNLOAD ACTIONS ==========

    /**
     * Tải xuống file
     */
    const handleDownload = useCallback(async (file) => {
        const toastId = toast.loading(`Đang chuẩn bị tải:  ${file.name}... `);
        try {
            const response = await fileService.downloadFile(file.id);

            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name);
            document.body.appendChild(link);
            link.click();

            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.dismiss(toastId);
            toast.success("Đã tải xuống thành công!");
        } catch (error) {
            toast.dismiss(toastId);

            let message = "Lỗi khi tải file.  Có thể file đã bị xóa hoặc không có quyền. ";

            if (error.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    const json = JSON.parse(text);
                    if (json.message) message = json.message;
                } catch (parseError) {
                    console.error("Không thể parse lỗi blob:", parseError);
                }
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            }

            toast.error(message);
        }
    }, []);

    /**
     * Click vào file để xem hoặc tải
     */
    const handleFileClick = useCallback((file) => {
        const isViewable =
            file.mimeType === 'application/pdf' ||
            file.name.toLowerCase().endsWith('.docx') ||
            file.name.toLowerCase().endsWith('.doc');

        if (isViewable) {
            navigate(`/file/view/${file.id}`);
        } else {
            handleDownload(file);
        }
    }, [navigate, handleDownload]);

    // ========== RENAME ACTIONS ==========

    /**
     * Mở modal đổi tên
     */
    const openRenameModal = useCallback((file) => {
        setRenameData({ item: file, newName: file.name });
        setShowRenameModal(true);
    }, []);

    /**
     * Đóng modal đổi tên
     */
    const closeRenameModal = useCallback(() => {
        setShowRenameModal(false);
        setRenameData({ item: null, newName: '' });
    }, []);

    /**
     * Submit đổi tên
     */
    const submitRename = useCallback(async (e) => {
        e.preventDefault();
        if (!renameData.newName.trim()) return;

        if (contextHandleRename) {
            const success = await contextHandleRename(renameData.item, renameData.newName);
            if (success) {
                closeRenameModal();
            }
        }
    }, [renameData, contextHandleRename, closeRenameModal]);

    // ========== DESCRIPTION ACTIONS ==========

    /**
     * Mở modal cập nhật mô tả
     */
    const openDescModal = useCallback((file) => {
        setDescData({ item: file, description: file.description || '' });
        setShowDescModal(true);
    }, []);

    /**
     * Đóng modal cập nhật mô tả
     */
    const closeDescModal = useCallback(() => {
        setShowDescModal(false);
        setDescData({ item: null, description: '' });
    }, []);

    /**
     * Submit cập nhật mô tả
     */
    const submitDescription = useCallback(async (e) => {
        e.preventDefault();

        if (contextHandleUpdateDescription) {
            const success = await contextHandleUpdateDescription(descData.item, descData.description);
            if (success) {
                closeDescModal();
            }
        }
    }, [descData, contextHandleUpdateDescription, closeDescModal]);

    // ========== INFO ACTIONS ==========

    /**
     * Fetch và hiển thị thông tin chi tiết
     */
    const fetchFileInfo = useCallback(async (file) => {
        setShowInfoModal(true);
        setInfoLoading(true);
        try {
            const res = await fileService.getFileDetails(file.id);
            if (res.success) {
                setInfoData(res.data);
            }
        } catch (error) {
            toast.error("Không thể lấy thông tin file.");
            setShowInfoModal(false);
        } finally {
            setInfoLoading(false);
        }
    }, []);

    /**
     * Đóng modal thông tin
     */
    const closeInfoModal = useCallback(() => {
        setShowInfoModal(false);
        setInfoData(null);
    }, []);

    // ========== SHARE ACTIONS ==========

    /**
     * Mở modal chia sẻ
     */
    const openShareModal = useCallback(async (file) => {
        setShowShareModal(true);
        setShareLoading(true);
        try {
            const res = await fileService.getFileDetails(file.id);
            if (res.success) {
                setShareData(res.data);
            }
        } catch (error) {
            toast.error("Lỗi tải thông tin chia sẻ.");
            setShowShareModal(false);
        } finally {
            setShareLoading(false);
        }
    }, []);

    /**
     * Đóng modal chia sẻ
     */
    const closeShareModal = useCallback(() => {
        setShowShareModal(false);
        setShareData(null);
        setEmailInput('');
        setPermissionInput('VIEWER');
    }, []);

    /**
     * Thêm người dùng chia sẻ
     */
    const handleAddUserShare = useCallback(async (e) => {
        e.preventDefault();
        if (!emailInput.trim() || !shareData) return;

        try {
            const res = await fileService.shareFile(shareData.id, emailInput, permissionInput);
            if (res.success) {
                toast.success("Đã chia sẻ thành công!");
                setEmailInput('');
                // Reload lại data modal
                const refreshRes = await fileService.getFileDetails(shareData.id);
                if (refreshRes.success) {
                    setShareData(refreshRes.data);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi chia sẻ.");
        }
    }, [emailInput, permissionInput, shareData]);

    /**
     * Click nút xóa quyền (mở modal xác nhận)
     */
    const clickRevoke = useCallback((user) => {
        setUserToRevoke(user);
        setShowConfirmRevokeModal(true);
    }, []);

    /**
     * Xác nhận xóa quyền
     */
    const confirmRevoke = useCallback(async () => {
        if (!userToRevoke || !shareData) return;

        setRevokeLoading(true);
        try {
            const res = await fileService.revokeAccess(shareData.id, userToRevoke.email);
            if (res.success) {
                toast.success(`Đã ngừng chia sẻ với ${userToRevoke.email}`);

                setShareData(prev => ({
                    ...prev,
                    sharedWith: prev.sharedWith.filter(p => p.user.email !== userToRevoke.email)
                }));

                setShowConfirmRevokeModal(false);
                setUserToRevoke(null);
            }
        } catch (error) {
            toast.error("Không thể gỡ quyền lúc này.  Vui lòng thử lại.");
        } finally {
            setRevokeLoading(false);
        }
    }, [userToRevoke, shareData]);

    /**
     * Đóng modal xác nhận xóa quyền
     */
    const closeConfirmRevokeModal = useCallback(() => {
        setShowConfirmRevokeModal(false);
        setUserToRevoke(null);
    }, []);

    /**
     * Thay đổi quyền truy cập chung (public/private)
     */
    const handleChangePublicAccess = useCallback(async (e) => {
        if (!shareData) return;

        const newAccess = e.target.value;
        try {
            const res = await fileService.changePublicAccess(shareData.id, newAccess);
            if (res.success) {
                toast.success("Đã cập nhật quyền truy cập chung.");
                setShareData(prev => ({ ...prev, publicAccess: newAccess }));
            }
        } catch (error) {
            toast.error("Lỗi cập nhật quyền.");
        }
    }, [shareData]);

    /**
     * Cập nhật quyền của người dùng
     */
    const handleUpdatePermission = useCallback(async (email, newPermission) => {
        if (!shareData) return;

        try {
            const res = await fileService.shareFile(shareData.id, email, newPermission);

            if (res.success) {
                toast.success("Đã cập nhật quyền thành công.");

                setShareData(prev => ({
                    ...prev,
                    sharedWith: prev.sharedWith.map(perm =>
                        perm.user.email === email
                            ? { ...perm, permissionType: newPermission }
                            : perm
                    )
                }));
            }
        } catch (error) {
            toast.error("Không thể cập nhật quyền.  Vui lòng thử lại.");
        }
    }, [shareData]);

    /**
     * Sao chép liên kết chia sẻ
     */
    const copyShareLink = useCallback(() => {
        if (!shareData) return;

        const link = generateShareLink(shareData);

        navigator.clipboard.writeText(link)
            .then(() => toast.success("Đã sao chép đường liên kết! "))
            .catch(() => toast.error("Lỗi khi sao chép."));
    }, [shareData, generateShareLink]);

    // ========== COPY LINK ACTION ==========

    /**
     * Sao chép liên kết của file/folder
     */
    const handleCopyLink = useCallback((file) => {
        const link = generateShareLink(file);
        navigator.clipboard.writeText(link)
            .then(() => toast.success("Đã sao chép liên kết!"))
            .catch(() => toast.error("Lỗi khi sao chép."));
    }, [generateShareLink]);

    // ========== COPY FILE ACTION ==========

    /**
     * Tạo bản sao file
     */
    const handleCopyFile = useCallback(async (file) => {
        const toastId = toast.loading("Đang tạo bản sao...");
        try {
            const res = await fileService.copyFile(file.id);
            if (res.success) {
                toast.update(toastId, {
                    render: `Đã tạo bản sao: ${res.data.name}`,
                    type: "success",
                    isLoading: false,
                    autoClose: 3000
                });

                if (onRefresh) onRefresh();
            }
        } catch (error) {
            toast.update(toastId, {
                render: error.response?.data?.message || "Lỗi khi tạo bản sao.",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        }
    }, [onRefresh]);

    // ========== MOVE ACTIONS ==========

    /**
     * Mở modal di chuyển
     */
    const openMoveModal = useCallback((files) => {
        if (setSelection) {
            setSelection(Array.isArray(files) ? files : [files]);
        }
        setShowMoveModal(true);
    }, [setSelection]);

    /**
     * Đóng modal di chuyển
     */
    const closeMoveModal = useCallback(() => {
        setShowMoveModal(false);
    }, []);

    /**
     * Callback sau khi di chuyển thành công
     */
    const handleMoveSuccess = useCallback(() => {
        if (onRefresh) onRefresh();
        if (setSelection) setSelection([]);
    }, [onRefresh, setSelection]);

    // ========== DELETE ACTIONS ==========

    /**
     * Mở modal xóa (soft delete)
     */
    const handleSoftDelete = useCallback((items) => {
        if (!items || items.length === 0) return;

        setFilesToDelete(Array.isArray(items) ? items : [items]);
        setShowDeleteModal(true);
    }, []);

    /**
     * Đóng modal xóa
     */
    const closeDeleteModal = useCallback(() => {
        setShowDeleteModal(false);
        setFilesToDelete([]);
    }, []);

    /**
     * Thực hiện xóa
     */
    const executeDelete = useCallback(async () => {
        if (filesToDelete.length === 0) return;

        setDeleting(true);
        const toastId = toast.loading("Đang chuyển vào thùng rác.. .");

        try {
            const ids = filesToDelete.map(f => f.id);
            const res = await fileService.moveToTrash(ids);

            if (res.success) {
                toast.update(toastId, {
                    render: `Đã xóa thành công`,
                    type: "success",
                    isLoading: false,
                    autoClose: 2000
                });

                if (onRefresh) onRefresh();
                if (setSelection) setSelection([]);
                closeDeleteModal();
            }
        } catch (error) {
            toast.update(toastId, {
                render: "Lỗi khi xóa file.",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        } finally {
            setDeleting(false);
        }
    }, [filesToDelete, onRefresh, setSelection, closeDeleteModal]);

    // ========== CREATE FOLDER ACTIONS ==========

    /**
     * Mở modal tạo folder
     */
    const openCreateFolderModal = useCallback(() => {
        setShowCreateModal(true);
        setNewFolderName('');
    }, []);

    /**
     * Đóng modal tạo folder
     */
    const closeCreateFolderModal = useCallback(() => {
        setShowCreateModal(false);
        setNewFolderName('');
    }, []);

    /**
     * Submit tạo folder
     */
    const submitCreateFolder = useCallback(async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        if (contextHandleCreateFolder) {
            const success = await contextHandleCreateFolder(newFolderName);
            if (success) {
                closeCreateFolderModal();
            }
        }
    }, [newFolderName, contextHandleCreateFolder, closeCreateFolderModal]);

    // ========== UPLOAD ACTIONS ==========

    /**
     * Trigger input file
     */
    const triggerFileUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    /**
     * Trigger input folder
     */
    const triggerFolderUpload = useCallback(() => {
        folderInputRef.current?.click();
    }, []);

    /**
     * Xử lý khi chọn file upload
     */
    const onFileSelect = useCallback(async (e) => {
        const rawFiles = e.target.files;
        if (!rawFiles || rawFiles.length === 0) return;

        const allFiles = Array.from(rawFiles);

        if (allFiles.length > 0 && contextHandleUploadFile) {
            await contextHandleUploadFile(allFiles);
        }

        e.target.value = null;
    }, [contextHandleUploadFile]);

    /**
     * Xử lý khi chọn folder upload
     */
    const onFolderSelect = useCallback(async (e) => {
        const rawFiles = e.target.files;
        if (!rawFiles || rawFiles.length === 0) return;

        const allFiles = Array.from(rawFiles);

        if (contextHandleUploadFolder) {
            await contextHandleUploadFolder(allFiles);
        }

        e.target.value = null;
    }, [contextHandleUploadFolder]);

    // ========== RETRY ACTION ==========

    /**
     * Thử xử lý lại file bị lỗi
     */
    const handleRetry = useCallback(async (e, file, setFiles) => {
        e.stopPropagation();
        const toastId = toast.loading("Đang thử xử lý lại...");

        try {
            const res = await fileService.retryFile(file.id);

            if (res.success) {
                if (setFiles) {
                    setFiles(prev => prev.map(f =>
                        f.id === file.id ? { ...f, status: 'PROCESSING' } : f
                    ));
                }

                toast.update(toastId, {
                    render: "Đã gửi yêu cầu xử lý lại.",
                    type: "success", isLoading: false, autoClose: 2000
                });
            }
        } catch (error) {
            toast.update(toastId, {
                render: "Không thể thử lại.",
                type: "error", isLoading: false, autoClose: 2000
            });
        }
    }, []);

    // ========== MENU ACTION HANDLER ==========

    /**
     * Xử lý hành động từ menu
     */
    const handleMenuAction = useCallback((action, file, closeAllMenus) => {
        if (closeAllMenus) closeAllMenus();

        switch (action) {
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
                fetchFileInfo(file);
                break;
            case 'TRASH':
                handleSoftDelete([file]);
                break;
            case 'COPY':
                handleCopyFile(file);
                break;
            default:
                break;
        }
    }, [
        handleDownload, openRenameModal, openDescModal, openShareModal,
        handleCopyLink, openMoveModal, fetchFileInfo, handleSoftDelete, handleCopyFile
    ]);

    /**
     * Xử lý hành động từ background menu
     */
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

    return {
        // Refs
        fileInputRef,
        folderInputRef,
        renameInputRef,
        descInputRef,

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
        fetchFileInfo,
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
        openMoveModal,
        closeMoveModal,
        handleMoveSuccess,

        // Delete Modal
        showDeleteModal,
        filesToDelete,
        deleting,
        handleSoftDelete,
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
    };
};

export default useFileActions;