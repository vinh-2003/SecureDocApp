/**
 * Thông tin ứng dụng
 */
export const APP_INFO = {
    name: 'SecureDoc',
    shortName: 'SD',
    description: 'Quản lý tài liệu an toàn',
    tagline: 'Bảo mật tài liệu của bạn',
    version: '1.0.0',
    author: 'Your Company',
    website: 'https://securedoc.fun',
    supportEmail: 'support@securedoc.fun'
};

/**
 * SEO Meta tags (Giữ lại để tương thích cấu trúc, dù Mobile không dùng SEO)
 */
export const SEO = {
    title: 'SecureDoc - Quản lý tài liệu an toàn',
    description: 'Hệ thống quản lý và bảo mật tài liệu trực tuyến',
    keywords: 'tài liệu, bảo mật, quản lý file, secure document'
};

// Config sắp xếp (Dùng cho ActionSheet)
export const SORT_OPTIONS = [
    { value: 'updatedAt-desc', label: 'Mới nhất' },
    { value: 'updatedAt-asc', label: 'Cũ nhất' },
    { value: 'name-asc', label: 'Tên (A-Z)' },
    { value: 'name-desc', label: 'Tên (Z-A)' },
    { value: 'size-desc', label: 'Kích thước giảm dần' },
    { value: 'size-asc', label: 'Kích thước tăng dần' }
];