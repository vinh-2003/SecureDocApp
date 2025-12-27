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
   * @param {boolean} inline - true để xem, false để tải về
   */
  downloadFile: (id, inline = false) => {
    return axiosClient.get(`/files/download/${id}`, {
      params: { inline },
      responseType: 'blob', // <--- BẮT BUỘC: Để axios không cố parse JSON
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
};

export default fileService;