import React, { useCallback } from 'react';
import {
    FaFolder, FaFileAlt, FaFilePdf, FaFileWord,
    FaFileImage, FaSpinner, FaExclamationCircle,
    FaFileExcel, FaFilePowerpoint, FaFileVideo,
    FaFileAudio, FaFileArchive, FaFileCode
} from 'react-icons/fa';

/**
 * Hook cung cấp helper function để lấy icon cho file/folder
 * 
 * @returns {Object} - Helper function
 */
const useFileIcon = () => {
    /**
     * Lấy icon phù hợp với file/folder
     * @param {Object} file - Object file/folder
     * @param {boolean} isLarge - Có phải icon lớn không
     * @returns {JSX.Element} - Icon component
     */
    const getFileIcon = useCallback((file, isLarge = false) => {
        const { type, mimeType, status, name, extension } = file;
        const className = isLarge ? "text-5xl mb-2" : "text-2xl";

        const ext = extension?.toLowerCase() || name?.split('.').pop()?.toLowerCase() || '';

        // 1. Nếu đang xử lý -> Trả về Spinner xoay
        if (status === 'PROCESSING') {
            return <FaSpinner className={`text-blue-500 animate-spin ${className}`} />;
        }

        // 2. Nếu lỗi -> Trả về dấu chấm than
        if (status === 'FAILED') {
            return <FaExclamationCircle className={`text-red-500 ${className}`} />;
        }

        // 3. Trạng thái bình thường (AVAILABLE)
        if (type === 'FOLDER') {
            return <FaFolder className={`text-yellow-500 ${className}`} />;
        }
        // PDF
        if (mimeType?.includes('pdf') || ext === 'pdf') {
            return <FaFilePdf className={`text-red-500 ${className}`} />;
        }

        // Word
        if (mimeType?.includes('word') || mimeType?.includes('document') || ['doc', 'docx'].includes(ext)) {
            return <FaFileWord className={`text-blue-600 ${className}`} />;
        }

        // Excel (Mới)
        if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet') || mimeType?.includes('csv') || ['xls', 'xlsx', 'csv'].includes(ext)) {
            return <FaFileExcel className={`text-green-600 ${className}`} />;
        }

        // PowerPoint (Mới)
        if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint') || ['ppt', 'pptx'].includes(ext)) {
            return <FaFilePowerpoint className={`text-orange-500 ${className}`} />;
        }

        // Image
        if (mimeType?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
            return <FaFileImage className={`text-purple-500 ${className}`} />;
        }

        // Video (Mới)
        if (mimeType?.includes('video') || ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) {
            return <FaFileVideo className={`text-pink-500 ${className}`} />;
        }

        // Audio (Mới)
        if (mimeType?.includes('audio') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
            return <FaFileAudio className={`text-yellow-500 ${className}`} />;
        }

        // Archive/Zip (Mới)
        if (mimeType?.includes('zip') || mimeType?.includes('compressed') || mimeType?.includes('tar') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return <FaFileArchive className={`text-gray-600 ${className}`} />;
        }

        // Code/Text (Mới)
        if (['html', 'css', 'js', 'jsx', 'java', 'py', 'c', 'cpp', 'json', 'xml'].includes(ext)) {
            return <FaFileCode className={`text-gray-700 ${className}`} />;
        }

        // Mặc định
        return <FaFileAlt className={`text-gray-400 ${className}`} />;
    }, []);

    /**
     * Kiểm tra file có đang xử lý không
     */
    const isProcessing = useCallback((file) => {
        return file?.status === 'PROCESSING';
    }, []);

    /**
     * Kiểm tra file có bị lỗi không
     */
    const isFailed = useCallback((file) => {
        return file?.status === 'FAILED';
    }, []);

    /**
     * Kiểm tra file có khả dụng không
     */
    const isAvailable = useCallback((file) => {
        return file?.status === 'AVAILABLE' || !file?.status;
    }, []);

    return {
        getFileIcon,
        isProcessing,
        isFailed,
        isAvailable
    };
};

export default useFileIcon;