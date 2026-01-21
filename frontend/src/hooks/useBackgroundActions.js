import { useState, useRef, useCallback, useContext } from 'react';
import { toast } from 'react-toastify';
import { FileContext } from '../context/FileContext';

/**
 * Hook xử lý các hành động từ Background Context Menu
 * Bao gồm:  Create Folder, Upload File, Upload Folder
 * 
 * @param {Object} options - Các callback
 * @param {Function} options. onRefresh - Callback để refresh danh sách
 * 
 * @returns {Object} - Các state, refs và handlers
 */
const useBackgroundActions = (options = {}) => {
    const { onRefresh } = options;

    // Lấy các hàm từ FileContext
    const {
        handleCreateFolder: createFolderFromContext,
        handleUploadFile: uploadFileFromContext,
        handleUploadFolder: uploadFolderFromContext
    } = useContext(FileContext);

    // Modal state
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Input refs
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);

    // ==================== HELPER FUNCTIONS ====================

    /**
     * Kiểm tra định dạng file hợp lệ
     */
    const isAllowedFile = useCallback((file) => {
        const allowedExtensions = ['pdf', 'doc', 'docx'];
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd. openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedMimeTypes.includes(file.type)) return true;

        const ext = file.name.split('.').pop().toLowerCase();
        return allowedExtensions.includes(ext);
    }, []);

    // ==================== ACTION HANDLERS ====================

    /**
     * Mở modal tạo thư mục
     */
    const openCreateFolderModal = useCallback(() => {
        setNewFolderName('');
        setShowCreateFolderModal(true);
    }, []);

    /**
     * Đóng modal tạo thư mục
     */
    const closeCreateFolderModal = useCallback(() => {
        setShowCreateFolderModal(false);
        setNewFolderName('');
    }, []);

    /**
     * Submit tạo thư mục
     */
    const submitCreateFolder = useCallback(async (e) => {
        e?.preventDefault();
        if (!newFolderName.trim()) return false;

        const success = await createFolderFromContext(newFolderName);
        if (success) {
            closeCreateFolderModal();
            onRefresh?.();
            return true;
        }
        return false;
    }, [newFolderName, createFolderFromContext, closeCreateFolderModal, onRefresh]);

    /**
     * Trigger input chọn file
     */
    const triggerFileUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    /**
     * Trigger input chọn folder
     */
    const triggerFolderUpload = useCallback(() => {
        folderInputRef.current?.click();
    }, []);

    /**
     * Xử lý khi chọn file để upload
     */
    const handleFileSelect = useCallback(async (e) => {
        const rawFiles = e.target.files;
        if (!rawFiles || rawFiles.length === 0) return;

        const allFiles = Array.from(rawFiles);
        const validFiles = allFiles.filter(file => isAllowedFile(file));

        if (validFiles.length < allFiles.length) {
            toast.warning(`Đã bỏ qua ${allFiles.length - validFiles.length} tệp không hỗ trợ (Chỉ chấp nhận PDF, Word).`);
        }

        if (validFiles.length > 0) {
            await uploadFileFromContext(validFiles);
            onRefresh?.();
        }

        e.target.value = null;
    }, [isAllowedFile, uploadFileFromContext, onRefresh]);

    /**
     * Xử lý khi chọn folder để upload
     */
    const handleFolderSelect = useCallback(async (e) => {
        const rawFiles = e.target.files;
        if (!rawFiles || rawFiles.length === 0) return;

        const allFiles = Array.from(rawFiles);
        const validFiles = allFiles.filter(file => isAllowedFile(file));

        if (validFiles.length === 0) {
            toast.error("Thư mục không chứa tệp PDF hoặc Word nào.");
            e.target.value = null;
            return;
        }

        if (validFiles.length < allFiles.length) {
            toast.info(`Đang tải lên ${validFiles.length} tệp hợp lệ trong thư mục. `);
        }

        await uploadFolderFromContext(validFiles);
        onRefresh?.();

        e.target.value = null;
    }, [isAllowedFile, uploadFolderFromContext, onRefresh]);

    /**
     * Handler chính xử lý action từ Background Menu
     */
    const handleBackgroundAction = useCallback((action) => {
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
                console.warn(`Unknown background action: ${action}`);
                break;
        }
    }, [openCreateFolderModal, triggerFileUpload, triggerFolderUpload]);

    // ==================== RETURN ====================

    return {
        // Main handler
        handleBackgroundAction,

        // Create Folder Modal
        showCreateFolderModal,
        newFolderName,
        setNewFolderName,
        openCreateFolderModal,
        closeCreateFolderModal,
        submitCreateFolder,

        // File/Folder Upload
        fileInputRef,
        folderInputRef,
        triggerFileUpload,
        triggerFolderUpload,
        handleFileSelect,
        handleFolderSelect,

        // Helper
        isAllowedFile
    };
};

export default useBackgroundActions;