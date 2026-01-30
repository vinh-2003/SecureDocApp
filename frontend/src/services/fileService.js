import axiosClient from '../api/axiosClient';

/**
 * =============================================================================
 * FILE SERVICE
 * =============================================================================
 * Service quản lý tất cả API liên quan đến files, folders, sharing, trash, etc.
 * 
 * Được tổ chức theo các nhóm: 
 * 1. Dashboard & Stats
 * 2. Files & Folders - CRUD
 * 3. Upload
 * 4. Navigation & Search
 * 5. Sharing & Permissions
 * 6. Reader & Pages
 * 7. Access Requests
 * 8. Trash Management
 * 9. Recent & Shared
 * =============================================================================
 */

// =============================================================================
// 1. DASHBOARD & STATS
// =============================================================================

/**
 * Lấy thống kê dashboard (tổng file, dung lượng đã dùng, etc.)
 * @returns {Promise} Response chứa stats data
 */
const getDashboardStats = () => {
  return axiosClient.get('/files/dashboard/stats');
};

// =============================================================================
// 2. FILES & FOLDERS - CRUD
// =============================================================================

/**
 * Lấy danh sách files/folders trong một thư mục
 * @param {string|null} parentId - ID thư mục cha (null = root)
 * @param {string} sortBy - Trường sắp xếp (createdAt, name, size, updatedAt)
 * @param {string} direction - Hướng sắp xếp (asc, desc)
 * @returns {Promise} Response chứa danh sách files
 */
const getFiles = (parentId = null, sortBy = 'createdAt', direction = 'desc') => {
  return axiosClient.get('/files/list', {
    params: { parentId, sortBy, direction }
  });
};

/**
 * Lấy chi tiết một file/folder
 * @param {string} id - ID của file/folder
 * @returns {Promise} Response chứa thông tin chi tiết
 */
const getFileDetails = (id) => {
  return axiosClient.get(`/files/${id}/details`);
};

/**
 * Tạo thư mục mới
 * @param {string} name - Tên thư mục
 * @param {string|null} parentId - ID thư mục cha (null = root)
 * @returns {Promise} Response chứa folder mới tạo
 */
const createFolder = (name, parentId) => {
  return axiosClient.post('/files/folder', { name, parentId });
};

/**
 * Đổi tên thư mục
 * @param {string} id - ID thư mục
 * @param {string} newName - Tên mới
 * @returns {Promise} Response
 */
const renameFolder = (id, newName) => {
  return axiosClient.put(`/files/folders/${id}/rename`, { newName });
};

/**
 * Đổi tên file
 * @param {string} id - ID file
 * @param {string} newName - Tên mới
 * @returns {Promise} Response
 */
const renameFile = (id, newName) => {
  return axiosClient.put(`/files/files/${id}/rename`, { newName });
};

/**
 * Cập nhật mô tả thư mục
 * @param {string} id - ID thư mục
 * @param {string} description - Mô tả mới
 * @returns {Promise} Response
 */
const updateFolderDescription = (id, description) => {
  return axiosClient.put(`/files/folders/${id}/description`, { description });
};

/**
 * Cập nhật mô tả file
 * @param {string} id - ID file
 * @param {string} description - Mô tả mới
 * @returns {Promise} Response
 */
const updateFileDescription = (id, description) => {
  return axiosClient.put(`/files/files/${id}/description`, { description });
};

/**
 * Di chuyển files/folders sang thư mục khác
 * @param {Array<string>} itemIds - Danh sách ID cần di chuyển
 * @param {string|null} targetParentId - ID thư mục đích (null = root)
 * @returns {Promise} Response
 */
const moveFiles = (itemIds, targetParentId) => {
  return axiosClient.put('/files/move', { itemIds, targetParentId });
};

/**
 * Tạo bản sao file
 * @param {string} fileId - ID file cần copy
 * @returns {Promise} Response chứa file mới
 */
const copyFile = (fileId) => {
  return axiosClient.post(`/files/${fileId}/copy`);
};

/**
 * Thử xử lý lại file bị lỗi
 * @param {string} fileId - ID file
 * @returns {Promise} Response
 */
const retryFile = (fileId) => {
  return axiosClient.post(`/files/${fileId}/retry`);
};

// =============================================================================
// 3. UPLOAD
// =============================================================================

/**
 * Upload một file
 * @param {File} file - File object từ input
 * @param {string|null} parentId - ID thư mục cha
 * @returns {Promise} Response chứa file đã upload
 */
const uploadFile = (file, parentId) => {
  const formData = new FormData();
  formData.append('file', file);

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
 * @param {FormData} formData - FormData chứa nhiều files
 * @returns {Promise} Response
 */
const uploadBatch = (formData) => {
  return axiosClient.post('/files/upload/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

/**
 * Upload cả folder (giữ cấu trúc thư mục)
 * @param {FormData} formData - FormData chứa files và paths
 * @returns {Promise} Response
 */
const uploadFolder = (formData) => {
  return axiosClient.post('/files/upload/folder', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

/**
 * Tải file về máy
 * @param {string} id - ID file
 * @returns {Promise<Blob>} Blob data của file
 */
const downloadFile = (id) => {
  return axiosClient.get(`/files/download/${id}`, {
    responseType: 'blob'
  });
};

/**
 * Xem trước file (lấy Blob để hiển thị trên trình duyệt)
 * @param {string} id - ID file
 * @returns {Promise<Blob>} Blob data
 */
const previewFile = (id) => {
  return axiosClient.get(`/files/download/${id}`, {
    params: { inline: true }, // Truyền tham số inline=true
    responseType: 'blob'
  });
};

// =============================================================================
// 4. NAVIGATION & SEARCH
// =============================================================================

/**
 * Lấy breadcrumb path từ root đến folder hiện tại
 * @param {string} folderId - ID folder
 * @returns {Promise} Response chứa mảng breadcrumb items
 */
const getBreadcrumbs = (folderId) => {
  return axiosClient.get(`/files/breadcrumbs/${folderId}`);
};

/**
 * Alias cho getBreadcrumbs - Lấy thông tin folder
 * @param {string} id - ID folder
 * @returns {Promise} Response
 */
const getFolderInfo = (id) => {
  return axiosClient.get(`/files/breadcrumbs/${id}`);
};

/**
 * Lấy tất cả folders của user (dạng flat list)
 * @returns {Promise} Response chứa danh sách tất cả folders
 */
const getAllUserFolders = () => {
  return axiosClient.get('/files/folders/all');
};

/**
 * Tìm kiếm files với nhiều tiêu chí
 * @param {Object} params - Các tham số tìm kiếm
 * @param {string} [params.keyword] - Từ khóa
 * @param {string} [params.fileType] - Loại file (pdf, docx, FOLDER, etc.)
 * @param {string} [params.ownerId] - ID người tạo
 * @param {string} [params.locationId] - ID folder chứa
 * @param {string} [params.fromDate] - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} [params.toDate] - Ngày kết thúc (YYYY-MM-DD)
 * @param {boolean} [params.inTrash] - Có trong thùng rác không
 * @param {number} [params.page] - Số trang
 * @param {number} [params.size] - Kích thước trang
 * @returns {Promise} Response chứa kết quả tìm kiếm
 */
const searchFiles = (params) => {
  return axiosClient.get('/search', { params });
};

/**
 * [MỚI] Tìm kiếm ngữ nghĩa (AI Semantic Search)
 * API: GET /api/search/semantic
 * @param {string} query - Câu truy vấn mô tả (VD: "hợp đồng mua bán năm ngoái")
 * @param {number} limit - Số lượng kết quả tối đa
 */
const searchBySemantic = (query, limit = 20) => {
  return axiosClient.get('/search/semantic', {
    params: { query, limit }
  });
};

/**
 * [MỚI] Tìm kiếm bằng hình ảnh (AI Image Search)
 * API: POST /api/search/image
 * @param {File} file - File ảnh upload
 * @param {number} limit - Số lượng kết quả tối đa
 */
const searchByImage = (file, limit = 20) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('limit', limit);

  return axiosClient.post('/search/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// =============================================================================
// 5. SHARING & PERMISSIONS
// =============================================================================

/**
 * Chia sẻ file/folder với user khác
 * @param {string} id - ID file/folder
 * @param {string} email - Email người nhận
 * @param {string} role - Quyền:  'VIEWER' | 'COMMENTER' | 'EDITOR'
 * @returns {Promise} Response
 */
const shareFile = (id, email, role) => {
  return axiosClient.post(`/files/${id}/share`, { email, role });
};

/**
 * Thu hồi quyền truy cập của user
 * @param {string} id - ID file/folder
 * @param {string} email - Email người bị thu hồi
 * @returns {Promise} Response
 */
const revokeAccess = (id, email) => {
  return axiosClient.delete(`/files/${id}/share`, {
    params: { email }
  });
};

/**
 * Thay đổi quyền truy cập công khai
 * @param {string} id - ID file/folder
 * @param {string} accessLevel - Mức độ:  'PRIVATE' | 'PUBLIC_VIEW' | 'PUBLIC_EDIT'
 * @returns {Promise} Response
 */
const changePublicAccess = (id, accessLevel) => {
  return axiosClient.put(`/files/${id}/public`, { accessLevel });
};

// =============================================================================
// 6. READER & PAGES (Cho trang đọc sách)
// =============================================================================

/**
 * Lấy danh sách các trang của file (metadata)
 * @param {string} fileId - ID file
 * @returns {Promise} Response chứa danh sách pages
 */
const getFilePages = (fileId) => {
  return axiosClient.get(`/files/${fileId}/pages`);
};

/**
 * Lấy ảnh của một trang
 * @param {string} pageId - ID trang
 * @returns {Promise<Blob>} Blob ảnh của trang
 */
const getPageImage = (pageId) => {
  return axiosClient.get(`/pages/${pageId}/image`, {
    responseType: 'blob'
  });
};

/**
 * Toggle khóa/mở khóa trang (Chỉ owner)
 * @param {string} pageId - ID trang
 * @returns {Promise} Response
 */
const togglePageLock = (pageId) => {
  return axiosClient.put(`/pages/${pageId}/lock`);
};

// =============================================================================
// 7. ACCESS REQUESTS (Quy trình xin quyền xem trang bị khóa)
// =============================================================================

/**
 * Tạo yêu cầu xin mở khóa trang
 * @param {string} fileId - ID file
 * @param {Array<number>} pageIndexes - Danh sách index trang cần xin
 * @param {string} reason - Lý do xin quyền
 * @returns {Promise} Response
 */
const createAccessRequest = (fileId, pageIndexes, reason) => {
  return axiosClient.post('/requests', { fileId, pageIndexes, reason });
};

/**
 * Lấy danh sách yêu cầu cần duyệt (dành cho owner)
 * @returns {Promise} Response chứa danh sách requests
 */
const getIncomingRequests = () => {
  return axiosClient.get('/requests/managed');
};

/**
 * Duyệt hoặc từ chối yêu cầu
 * @param {string} requestId - ID request
 * @param {boolean} approved - true:  Duyệt, false:  Từ chối
 * @returns {Promise} Response
 */
const processAccessRequest = (requestId, approved) => {
  return axiosClient.put(`/requests/${requestId}/process`, null, {
    params: { approved }
  });
};

/**
 * Lấy danh sách quyền đã cấp cho file
 * @param {string} fileId - ID file
 * @returns {Promise} Response chứa danh sách granted access
 */
const getGrantedAccessList = (fileId) => {
  return axiosClient.get(`/files/${fileId}/access`);
};

/**
 * Thu hồi quyền xem trang đã cấp
 * @param {string} fileId - ID file
 * @param {string} userId - ID user bị thu hồi
 * @param {number} pageIndex - Index trang bị thu hồi
 * @returns {Promise} Response
 */
const revokePageAccess = (fileId, userId, pageIndex) => {
  return axiosClient.delete(`/files/${fileId}/access`, {
    params: { userId, pageIndex }
  });
};

// =============================================================================
// 8. TRASH MANAGEMENT
// =============================================================================

/**
 * Lấy danh sách files trong thùng rác
 * @param {string|null} parentId - ID folder cha trong trash (null = root trash)
 * @returns {Promise} Response chứa danh sách trash items
 */
const getTrashFiles = (parentId = null) => {
  return axiosClient.get('/files/trash', {
    params: { parentId }
  });
};

/**
 * Chuyển files vào thùng rác (Soft Delete)
 * @param {Array<string>} ids - Danh sách ID cần xóa
 * @returns {Promise} Response
 */
const moveToTrash = (ids) => {
  return axiosClient.put('/files/trash', { ids });
};

/**
 * Khôi phục files từ thùng rác
 * @param {Array<string>} ids - Danh sách ID cần khôi phục
 * @returns {Promise} Response
 */
const restoreFiles = (ids) => {
  return axiosClient.put('/files/restore', { ids });
};

/**
 * Xóa vĩnh viễn files (Hard Delete - Không thể khôi phục)
 * @param {Array<string>} ids - Danh sách ID cần xóa vĩnh viễn
 * @returns {Promise} Response
 */
const deletePermanently = (ids) => {
  return axiosClient.delete('/files/permanent', {
    data: { ids }
  });
};

// =============================================================================
// 9. RECENT & SHARED
// =============================================================================

/**
 * Lấy danh sách files đã mở gần đây
 * @param {number} page - Số trang (bắt đầu từ 0)
 * @param {number} limit - Số lượng mỗi trang
 * @returns {Promise} Response chứa danh sách recent items
 */
const getRecentFiles = (page = 0, limit = 10) => {
  return axiosClient.get('/files/recent', {
    params: { page, limit }
  });
};

/**
 * Lấy danh sách files được chia sẻ với user hiện tại
 * @param {number} page - Số trang (bắt đầu từ 0)
 * @param {number} limit - Số lượng mỗi trang
 * @returns {Promise} Response chứa danh sách shared items
 */
const getSharedFiles = (page = 0, limit = 20) => {
  return axiosClient.get('/files/shared', {
    params: { page, limit }
  });
};

// =============================================================================
// EXPORT
// =============================================================================

const fileService = {
  // Dashboard & Stats
  getDashboardStats,

  // Files & Folders - CRUD
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

  // Upload
  uploadFile,
  uploadBatch,
  uploadFolder,
  downloadFile,
  previewFile,

  // Navigation & Search
  getBreadcrumbs,
  getFolderInfo,
  getAllUserFolders,
  searchFiles,
  searchBySemantic,
  searchByImage,

  // Sharing & Permissions
  shareFile,
  revokeAccess,
  changePublicAccess,

  // Reader & Pages
  getFilePages,
  getPageImage,
  togglePageLock,

  // Access Requests
  createAccessRequest,
  getIncomingRequests,
  processAccessRequest,
  getGrantedAccessList,
  revokePageAccess,

  // Trash Management
  getTrashFiles,
  moveToTrash,
  restoreFiles,
  deletePermanently,

  // Recent & Shared
  getRecentFiles,
  getSharedFiles,
};

export default fileService;