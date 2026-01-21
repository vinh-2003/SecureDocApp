import React, { useCallback } from 'react';
import {
    FaFolder, FaFileAlt, FaFilePdf, FaFileWord,
    FaFileImage, FaSpinner, FaExclamationCircle
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
        const { type, mimeType, status } = file;
        const className = isLarge ? "text-5xl mb-2" : "text-2xl";

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
        if (mimeType?.includes('pdf')) {
            return <FaFilePdf className={`text-red-500 ${className}`} />;
        }
        if (mimeType?.includes('word') || mimeType?.includes('document')) {
            return <FaFileWord className={`text-blue-500 ${className}`} />;
        }
        if (mimeType?.includes('image')) {
            return <FaFileImage className={`text-purple-500 ${className}`} />;
        }

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