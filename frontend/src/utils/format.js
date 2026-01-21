import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format số bytes thành chuỗi dễ đọc
 */
export const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format ngày tháng đầy đủ
 */
export const formatDate = (dateString) => {
    if (!dateString) return '--';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '--';
    }
};

/**
 * Format ngày tháng ngắn gọn (chỉ ngày)
 */
export const formatDateShort = (dateString) => {
    if (!dateString) return '--';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch {
        return '--';
    }
};

/**
 * Format thời gian tương đối (vd: "5 phút trước")
 */
export const formatRelativeTime = (dateString) => {
    if (!dateString) return '--';

    try {
        const date = new Date(dateString);
        return formatDistanceToNow(date, { addSuffix: true, locale: vi });
    } catch {
        return '--';
    }
};