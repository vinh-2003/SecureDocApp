import React, { useCallback } from 'react';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * =============================================================================
 * USE FILE ICON HOOK (REACT NATIVE VERSION)
 * =============================================================================
 * Hook cung cấp helper functions để lấy icon cho file/folder
 * Đồng bộ với useFileIcon.js trên Web
 * =============================================================================
 */

const useFileIcon = () => {
    /**
     * Kiểm tra file có đang xử lý không
     * @param {Object} file - File object
     * @returns {boolean}
     */
    const isProcessing = useCallback((file) => {
        return file?.status === 'PROCESSING';
    }, []);

    /**
     * Kiểm tra file có bị lỗi không
     * @param {Object} file - File object
     * @returns {boolean}
     */
    const isFailed = useCallback((file) => {
        return file?.status === 'FAILED';
    }, []);

    /**
     * Kiểm tra file có khả dụng không
     * @param {Object} file - File object
     * @returns {boolean}
     */
    const isAvailable = useCallback((file) => {
        return file?.status === 'AVAILABLE' || !file?.status;
    }, []);

    /**
     * Lấy icon phù hợp với file/folder
     * @param {Object} file - Object file/folder
     * @param {number} size - Kích thước icon (default: 24)
     * @param {string} customColor - Màu tùy chỉnh (optional)
     * @returns {JSX.Element} - Icon component
     */
    const getFileIcon = useCallback((file, size = 24, customColor) => {
        if (!file) {
            return <FontAwesome5 name="file" size={size} color={customColor || "#9CA3AF"} />;
        }

        const { type, mimeType, status, name, extension } = file;
        const ext = extension?.toLowerCase() || name?.split('.').pop()?.toLowerCase() || '';

        // 1. Nếu đang xử lý -> Trả về Spinner
        if (status === 'PROCESSING') {
            return <FontAwesome5 name="spinner" size={size} color="#3B82F6" />;
        }

        // 2. Nếu lỗi -> Trả về dấu chấm than
        if (status === 'FAILED') {
            return <FontAwesome5 name="exclamation-circle" size={size} color="#EF4444" />;
        }

        // 3. Folder
        if (type === 'FOLDER') {
            return <FontAwesome5 name="folder" size={size} color={customColor || "#F59E0B"} solid />;
        }

        // 4. Mapping loại file sang Icon
        let iconName = 'file-alt';
        let iconColor = '#6B7280'; // Gray mặc định

        // PDF
        if (mimeType?.includes('pdf') || ext === 'pdf') {
            iconName = 'file-pdf';
            iconColor = '#EF4444'; // Red
        }
        // Word
        else if (mimeType?.includes('word') || mimeType?.includes('document') || ['doc', 'docx'].includes(ext)) {
            iconName = 'file-word';
            iconColor = '#2563EB'; // Blue
        }
        // Excel
        else if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet') || mimeType?.includes('csv') || ['xls', 'xlsx', 'csv'].includes(ext)) {
            iconName = 'file-excel';
            iconColor = '#10B981'; // Green
        }
        // PowerPoint
        else if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint') || ['ppt', 'pptx'].includes(ext)) {
            iconName = 'file-powerpoint';
            iconColor = '#F97316'; // Orange
        }
        // Image
        else if (mimeType?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
            iconName = 'file-image';
            iconColor = '#8B5CF6'; // Purple
        }
        // Video
        else if (mimeType?.includes('video') || ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv'].includes(ext)) {
            iconName = 'file-video';
            iconColor = '#EC4899'; // Pink
        }
        // Audio
        else if (mimeType?.includes('audio') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
            iconName = 'file-audio';
            iconColor = '#F59E0B'; // Yellow
        }
        // Archive/Zip
        else if (mimeType?.includes('zip') || mimeType?.includes('compressed') || mimeType?.includes('tar') || mimeType?.includes('rar') || ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
            iconName = 'file-archive';
            iconColor = '#6B7280'; // Gray
        }
        // Code
        else if (['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'java', 'py', 'c', 'cpp', 'h', 'json', 'xml', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(ext)) {
            iconName = 'file-code';
            iconColor = '#374151'; // Dark Gray
        }
        // Text
        else if (mimeType?.includes('text') || ['txt', 'md', 'rtf', 'log'].includes(ext)) {
            iconName = 'file-alt';
            iconColor = '#6B7280';
        }

        return <FontAwesome5 name={iconName} size={size} color={customColor || iconColor} />;
    }, []);

    /**
     * Lấy tên icon dựa trên loại file (không render component)
     * @param {Object} file - File object
     * @returns {string} - Tên icon FontAwesome5
     */
    const getIconName = useCallback((file) => {
        if (!file) return 'file';
        
        const { type, mimeType, status, name, extension } = file;
        const ext = extension?.toLowerCase() || name?.split('.').pop()?.toLowerCase() || '';

        if (status === 'PROCESSING') return 'spinner';
        if (status === 'FAILED') return 'exclamation-circle';
        if (type === 'FOLDER') return 'folder';

        if (mimeType?.includes('pdf') || ext === 'pdf') return 'file-pdf';
        if (mimeType?.includes('word') || ['doc', 'docx'].includes(ext)) return 'file-word';
        if (mimeType?.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) return 'file-excel';
        if (mimeType?.includes('powerpoint') || ['ppt', 'pptx'].includes(ext)) return 'file-powerpoint';
        if (mimeType?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'file-image';
        if (mimeType?.includes('video') || ['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return 'file-video';
        if (mimeType?.includes('audio') || ['mp3', 'wav', 'ogg'].includes(ext)) return 'file-audio';
        if (mimeType?.includes('zip') || ['zip', 'rar', '7z'].includes(ext)) return 'file-archive';
        if (['js', 'html', 'css', 'json', 'py', 'java'].includes(ext)) return 'file-code';

        return 'file-alt';
    }, []);

    /**
     * Lấy màu icon dựa trên loại file
     * @param {Object} file - File object
     * @returns {string} - Mã màu hex
     */
    const getIconColor = useCallback((file) => {
        if (!file) return '#6B7280';
        
        const { type, mimeType, status, name, extension } = file;
        const ext = extension?.toLowerCase() || name?.split('.').pop()?.toLowerCase() || '';

        if (status === 'PROCESSING') return '#3B82F6';
        if (status === 'FAILED') return '#EF4444';
        if (type === 'FOLDER') return '#F59E0B';

        if (mimeType?.includes('pdf') || ext === 'pdf') return '#EF4444';
        if (mimeType?.includes('word') || ['doc', 'docx'].includes(ext)) return '#2563EB';
        if (mimeType?.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) return '#10B981';
        if (mimeType?.includes('powerpoint') || ['ppt', 'pptx'].includes(ext)) return '#F97316';
        if (mimeType?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '#8B5CF6';
        if (mimeType?.includes('video') || ['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return '#EC4899';
        if (mimeType?.includes('audio') || ['mp3', 'wav', 'ogg'].includes(ext)) return '#F59E0B';

        return '#6B7280';
    }, []);

    return {
        getFileIcon,
        getIconName,
        getIconColor,
        isProcessing,
        isFailed,
        isAvailable
    };
};

export default useFileIcon;