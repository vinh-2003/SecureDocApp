import axiosClient from '../api/axiosClient';

/**
 * =============================================================================
 * FILE SERVICE (REACT NATIVE VERSION)
 * =============================================================================
 * Service quản lý tất cả API liên quan đến files, folders, sharing, trash, etc.
 * * LƯU Ý CHO MOBILE:
 * 1. Upload: Đối tượng file phải có dạng { uri, name, type }
 * 2. Download: Axios trả về Blob, cần dùng FileReader hoặc expo-file-system để lưu.
 * =============================================================================
 */

// =============================================================================
// 1. DASHBOARD & STATS
// =============================================================================

const getDashboardStats = () => {
    return axiosClient.get('/files/dashboard/stats');
};

// =============================================================================
// 2. FILES & FOLDERS - CRUD
// =============================================================================

const getFiles = (parentId = null, sortBy = 'createdAt', direction = 'desc') => {
    return axiosClient.get('/files/list', {
        params: { parentId, sortBy, direction }
    });
};

const getFileDetails = (id) => {
    return axiosClient.get(`/files/${id}/details`);
};

const createFolder = (name, parentId) => {
    return axiosClient.post('/files/folder', { name, parentId });
};

const renameFolder = (id, newName) => {
    return axiosClient.put(`/files/folders/${id}/rename`, { newName });
};

const renameFile = (id, newName) => {
    return axiosClient.put(`/files/files/${id}/rename`, { newName });
};

const updateFolderDescription = (id, description) => {
    return axiosClient.put(`/files/folders/${id}/description`, { description });
};

const updateFileDescription = (id, description) => {
    return axiosClient.put(`/files/files/${id}/description`, { description });
};

const moveFiles = (itemIds, targetParentId) => {
    return axiosClient.put('/files/move', { itemIds, targetParentId });
};

const copyFile = (fileId) => {
    return axiosClient.post(`/files/${fileId}/copy`);
};

const retryFile = (fileId) => {
    return axiosClient.post(`/files/${fileId}/retry`);
};

// =============================================================================
// 3. UPLOAD (QUAN TRỌNG: Cấu hình cho Mobile)
// =============================================================================

/**
 * Upload một file
 * @param {Object} file - Object file từ DocumentPicker { uri, name, type }
 * @param {string|null} parentId 
 */
const uploadFile = (file, parentId) => {
    const formData = new FormData();

    // React Native yêu cầu đúng cấu trúc này
    formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || file.type || 'application/octet-stream'
    });

    if (parentId) {
        formData.append('parentId', parentId);
    }
    formData.append('description', '');

    return axiosClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

/**
 * Upload nhiều files cùng lúc
 * @param {FormData} formData - FormData đã được append sẵn { uri, name, type } từ Context
 */
const uploadBatch = (formData) => {
    return axiosClient.post('/files/upload/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

/**
 * Upload cả folder
 * LƯU Ý: Mobile thường không hỗ trợ chọn cả folder (webkitRelativePath) như Web.
 * Hàm này giữ lại để tương thích API nhưng thực tế ít dùng trên Mobile.
 */
const uploadFolder = (formData) => {
    return axiosClient.post('/files/upload/folder', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

/**
 * Tải file về máy (Trả về Blob)
 * Trên Mobile: Nên cân nhắc dùng 'expo-file-system' để tải trực tiếp vào bộ nhớ máy
 * thay vì dùng axios nếu file lớn.
 */
const downloadFile = (id) => {
    return axiosClient.get(`/files/download/${id}`, {
        responseType: 'blob'
    });
};

// =============================================================================
// 4. NAVIGATION & SEARCH
// =============================================================================

const getBreadcrumbs = (folderId) => {
    return axiosClient.get(`/files/breadcrumbs/${folderId}`);
};

const getFolderInfo = (id) => {
    return axiosClient.get(`/files/breadcrumbs/${id}`);
};

const getAllUserFolders = () => {
    return axiosClient.get('/files/folders/all');
};

const searchFiles = (params, config = {}) => {
    return axiosClient.get('/search', {
        params,      // Các tham số query (keyword, limit...)
        ...config    // Các cấu hình khác (bao gồm signal)
    });
};

// =============================================================================
// 5. SHARING & PERMISSIONS
// =============================================================================

const shareFile = (id, email, role) => {
    return axiosClient.post(`/files/${id}/share`, { email, role });
};

const revokeAccess = (id, email) => {
    return axiosClient.delete(`/files/${id}/share`, {
        params: { email }
    });
};

const changePublicAccess = (id, accessLevel) => {
    return axiosClient.put(`/files/${id}/public`, { accessLevel });
};

// =============================================================================
// 6. READER & PAGES
// =============================================================================

const getFilePages = (fileId) => {
    return axiosClient.get(`/files/${fileId}/pages`);
};

const getPageImage = (pageId) => {
    return axiosClient.get(`/pages/${pageId}/image`, {
        responseType: 'blob' // Mobile cần xử lý Blob -> Base64 để hiển thị
    });
};

const togglePageLock = (pageId) => {
    return axiosClient.put(`/pages/${pageId}/lock`);
};

// =============================================================================
// 7. ACCESS REQUESTS
// =============================================================================

const createAccessRequest = (fileId, pageIndexes, reason) => {
    return axiosClient.post('/requests', { fileId, pageIndexes, reason });
};

const getIncomingRequests = () => {
    return axiosClient.get('/requests/managed');
};

const processAccessRequest = (requestId, approved) => {
    return axiosClient.put(`/requests/${requestId}/process`, null, {
        params: { approved }
    });
};

const getGrantedAccessList = (fileId) => {
    return axiosClient.get(`/files/${fileId}/access`);
};

const revokePageAccess = (fileId, userId, pageIndex) => {
    return axiosClient.delete(`/files/${fileId}/access`, {
        params: { userId, pageIndex }
    });
};

// =============================================================================
// 8. TRASH MANAGEMENT
// =============================================================================

const getTrashFiles = (parentId = null) => {
    return axiosClient.get('/files/trash', {
        params: { parentId }
    });
};

const moveToTrash = (ids) => {
    return axiosClient.put('/files/trash', { ids });
};

const restoreFiles = (ids) => {
    return axiosClient.put('/files/restore', { ids });
};

const deletePermanently = (ids) => {
    return axiosClient.delete('/files/permanent', {
        data: { ids }
    });
};

// =============================================================================
// 9. RECENT & SHARED
// =============================================================================

const getRecentFiles = (page = 0, limit = 10) => {
    return axiosClient.get('/files/recent', {
        params: { page, limit }
    });
};

const getSharedFiles = (page = 0, limit = 20) => {
    return axiosClient.get('/files/shared', {
        params: { page, limit }
    });
};

// =============================================================================
// EXPORT
// =============================================================================

const fileService = {
    getDashboardStats,
    getFiles,
    getFileDetails,
    createFolder,
    renameFolder,
    renameFile,
    updateFolderDescription,
    updateFileDescription,
    moveFiles,
    copyFile,
    retryFile,
    uploadFile,
    uploadBatch,
    uploadFolder,
    downloadFile,
    getBreadcrumbs,
    getFolderInfo,
    getAllUserFolders,
    searchFiles,
    shareFile,
    revokeAccess,
    changePublicAccess,
    getFilePages,
    getPageImage,
    togglePageLock,
    createAccessRequest,
    getIncomingRequests,
    processAccessRequest,
    getGrantedAccessList,
    revokePageAccess,
    getTrashFiles,
    moveToTrash,
    restoreFiles,
    deletePermanently,
    getRecentFiles,
    getSharedFiles,
};

export default fileService;