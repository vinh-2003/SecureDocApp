import axiosClient from '../api/axiosClient';

const fileService = {
  getDashboardStats: () => {
    return axiosClient.get('/files/dashboard/stats');
  },

  // Sửa hàm này để nhận thêm parentId
  getFiles: (parentId = null, sortBy = 'createdAt', direction = 'desc') => {
    return axiosClient.get(`/files/list`, {
      params: { parentId, sortBy, direction }
    });
  },

  // Tạo thư mục mới
  createFolder: (name, parentId) => {
    return axiosClient.post('/files/folder', { name, parentId });
  },

  // Upload File (Dùng FormData)
  uploadFile: (file, parentId) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Gửi kèm metadata (parentId)
    // Lưu ý: Backend dùng @ModelAttribute FileMetadataRequest nên ta append từng field
    if (parentId) {
        formData.append('parentId', parentId);
    }
    // API yêu cầu description nhưng bạn bảo không cần, ta để trống hoặc không gửi
    formData.append('description', ''); 

    return axiosClient.post('/files/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
  },

  uploadBatch: (formData) => {
    return axiosClient.post('/files/upload/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Upload Folder (Gửi files + paths)
  uploadFolder: (formData) => {
    return axiosClient.post('/files/upload/folder', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // API mới lấy đường dẫn
  getBreadcrumbs: (folderId) => {
    return axiosClient.get(`/files/breadcrumbs/${folderId}`);
  },

  getFolderInfo: (id) => {
    return axiosClient.get(`/files/breadcrumbs/${id}`);
  },

  // API TÌM KIẾM
  searchFiles: (params) => {
    // params là object chứa: keyword, fileType, fromDate...
    return axiosClient.get('/search', { params });
  },

  getAllUserFolders: () => {
    return axiosClient.get('/files/folders/all');
  },

  /**
   * Tải file hoặc lấy content để preview
   * @param {string} id - ID của file
   */
  downloadFile: (id) => {
    return axiosClient.get(`/files/download/${id}`, {
      responseType: 'blob',
    });
  },

  // --- THÊM: ĐỔI TÊN ---
  renameFolder: (id, newName) => {
    return axiosClient.put(`/files/folders/${id}/rename`, { newName });
  },

  renameFile: (id, newName) => {
    return axiosClient.put(`/files/files/${id}/rename`, { newName });
  },

  // --- THÊM: CẬP NHẬT MÔ TẢ ---
  updateFolderDescription: (id, description) => {
    return axiosClient.put(`/files/folders/${id}/description`, { description });
  },

  updateFileDescription: (id, description) => {
    return axiosClient.put(`/files/files/${id}/description`, { description });
  },

  // --- THÊM: LẤY CHI TIẾT FILE ---
  getFileDetails: (id) => {
    return axiosClient.get(`/files/${id}/details`);
  },

  // --- CÁC API CHIA SẺ ---
  
  // 1. Thêm người chia sẻ (email + permission)
  shareFile: (id, email, role) => {
    // permission: 'VIEWER', 'COMMENTER', 'EDITOR'
    return axiosClient.post(`/files/${id}/share`, { email, role });
  },

  // 2. Xóa quyền truy cập
  revokeAccess: (id, email) => {
    return axiosClient.delete(`/files/${id}/share`, {
      params: { email }
    });
  },

  // 3. Thay đổi quyền truy cập chung (Public Access)
  changePublicAccess: (id, accessLevel) => {
    // accessLevel: 'PRIVATE', 'PUBLIC_VIEW', 'PUBLIC_EDIT'
    return axiosClient.put(`/files/${id}/public`, { accessLevel });
  },

  // ============================================================
  // --- [MỚI] READER & PAGE API (Dùng cho trang đọc sách) ---
  // ============================================================

  // 1. Lấy danh sách các trang (Metadata: id, index, isLocked, canViewClear...)
  getFilePages: (fileId) => {
    return axiosClient.get(`/files/${fileId}/pages`);
  },

  /**
   * 2. Lấy nội dung ảnh của trang (Stream từ GridFS)
   * QUAN TRỌNG: Phải dùng responseType: 'blob' để FE tạo được URL ảnh
   */
  getPageImage: (pageId) => {
    return axiosClient.get(`/pages/${pageId}/image`, {
        responseType: 'blob' 
    });
  },

  // 3. Toggle Khoá/Mở khoá trang (Dành cho Chủ sở hữu)
  togglePageLock: (pageId) => {
    return axiosClient.put(`/pages/${pageId}/lock`);
  },

  // ============================================================
  // --- [MỚI] ACCESS REQUEST API (Quy trình xin quyền) ---
  // ============================================================

  // 4. Gửi yêu cầu xin mở khoá trang
  createAccessRequest: (fileId, pageIndexes, reason) => {
    // pageIndexes là mảng số nguyên, ví dụ: [0, 1, 5]
    return axiosClient.post('/requests', { fileId, pageIndexes, reason });
  },

  // 5. Lấy danh sách yêu cầu cần duyệt (Dành cho Chủ sở hữu - Dashboard)
  getIncomingRequests: () => {
    return axiosClient.get('/requests/managed');
  },

  /**
   * 6. Duyệt hoặc Từ chối yêu cầu
   * @param {string} requestId - ID của request
   * @param {boolean} approved - true: Duyệt, false: Từ chối
   */
  processAccessRequest: (requestId, approved) => {
    // Backend nhận @RequestParam nên ta dùng params
    return axiosClient.put(`/requests/${requestId}/process`, null, {
        params: { approved }
    });
  },

  // Lấy danh sách quyền đã cấp
  getGrantedAccessList: (fileId) => {
      return axiosClient.get(`/files/${fileId}/access`);
  },

  // Thu hồi quyền
  revokePageAccess: (fileId, userId, pageIndex) => {
      return axiosClient.delete(`/files/${fileId}/access`, {
          params: { userId, pageIndex }
      });
  },

  // API lấy file gần đây
  getRecentFiles: (page = 0, limit = 10) => {
    return axiosClient.get('/files/recent', { params: { page, limit } });
  },

  /**
   * Di chuyển file/folder
   * @param {Array<string>} itemIds - Danh sách ID cần di chuyển
   * @param {string|null} targetParentId - ID thư mục đích (null = Root)
   */
  moveFiles: (itemIds, targetParentId) => {
    return axiosClient.put('/files/move', { itemIds, targetParentId });
  },

  // --- [MỚI] API THÙNG RÁC ---

  // 1. Lấy danh sách file trong thùng rác
  getTrashFiles: (parentId = null) => {
    return axiosClient.get('/files/trash', {
      params: { parentId }
    });
  },

  // 2. Chuyển vào thùng rác (Soft Delete)
  moveToTrash: (ids) => {
    // Body: { ids: ["id1", "id2"] }
    return axiosClient.put('/files/trash', { ids });
  },

  // 3. Khôi phục (Restore)
  restoreFiles: (ids) => {
    return axiosClient.put('/files/restore', { ids });
  },

  // 4. Xóa vĩnh viễn (Hard Delete)
  deletePermanently: (ids) => {
    // Lưu ý: Với axios, method DELETE cần truyền body qua property `data`
    return axiosClient.delete('/files/permanent', {
      data: { ids }
    });
  },

  // [MỚI] Lấy danh sách được chia sẻ
  getSharedFiles: (page = 0, limit = 20) => {
    return axiosClient.get('/files/shared', { 
        params: { page, limit } 
    });
  },

  // [MỚI] Tạo bản sao
  copyFile: (fileId) => {
      return axiosClient.post(`/files/${fileId}/copy`);
  },

  retryFile: (fileId) => {
        return axiosClient.post(`/files/${fileId}/retry`);
    },
};

export default fileService;