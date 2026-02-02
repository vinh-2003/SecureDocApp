import { getBaseUrl } from '../api/axiosClient';

/**
 * Lấy server base URL (không có /api)
 * Ví dụ: https://securedoc.fun hoặc http://10.0.2.2:8888
 */
export const getServerUrl = () => {
    const baseUrl = getBaseUrl(); // https://securedoc.fun/api
    // Loại bỏ /api ở cuối nếu có
    return baseUrl.replace(/\/api$/, '');
};

/**
 * Chuyển đổi URL từ backend về URL mobile có thể truy cập
 * @param {string} url - URL từ backend (có thể chứa localhost)
 */
export const resolveUrl = (url) => {
    if (!url) return null;
    
    const serverUrl = getServerUrl();
    
    // Nếu là relative path (bắt đầu bằng /)
    if (url.startsWith('/')) {
        return `${serverUrl}${url}`;
    }
    
    // Nếu chứa localhost, thay thế bằng server URL
    if (url.includes('localhost:8888')) {
        return url.replace('http://localhost:8888', serverUrl);
    }
    
    // Nếu chứa 127.0.0.1
    if (url.includes('127.0.0.1:8888')) {
        return url.replace('http://127.0.0.1:8888', serverUrl);
    }
    
    return url;
};

/**
 * Lấy avatar URL an toàn
 * @param {Object} user - User object có avatarUrl
 * @param {string} fallbackName - Tên để tạo placeholder
 */
export const getAvatarUrl = (user, fallbackName = 'User') => {
    // Lấy tên để làm ảnh thay thế nếu không có avatar
    const name = user?.fullName || user?.username || fallbackName;
    
    // Gọi hàm helper, truyền cả URL và Tên
    return getAvatarUrlFromAvatarUrl(user?.avatarUrl, name);
};

/**
 * Lấy file view URL an toàn
 * @param {string} fileId - ID của file
 */
export const getFileViewUrl = (fileId) => {
    if (!fileId) return null;
    return `${getBaseUrl()}/files/view/${fileId}`;
};

/**
 * Lấy download URL an toàn
 * @param {string} fileId - ID của file
 */
export const getDownloadUrl = (fileId) => {
    if (!fileId) return null;
    return `${getBaseUrl()}/files/download/${fileId}`;
};

/**
 * Lấy page image URL
 * @param {string} pageId - ID của page
 */
export const getPageImageUrl = (pageId) => {
    if (!pageId) return null;
    return `${getBaseUrl()}/pages/${pageId}/image`;
};

/**
 * Lấy avatar URL chuẩn từ chuỗi URL raw (Xử lý localhost, relative path)
 * @param {string} avatarUrl - Đường dẫn avatar gốc
 * @param {string|null} fallbackName - Tên để tạo ảnh thay thế nếu avatarUrl rỗng (Tuỳ chọn)
 * @returns {string|null} URL đã được xử lý
 */
export const getAvatarUrlFromAvatarUrl = (avatarUrl, fallbackName = null) => {
    // 1. Nếu có URL, tiến hành resolve để fix lỗi localhost/relative path trên mobile
    if (avatarUrl) {
        return resolveUrl(avatarUrl);
    }

    // 2. Nếu không có URL nhưng có tên fallback -> Dùng UI Avatars
    if (fallbackName) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random&size=200`;
    }

    // 3. Không có gì cả -> null (để React Native Image hiển thị defaultSource nếu có)
    return null;
};