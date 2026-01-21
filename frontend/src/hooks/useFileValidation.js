import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { ALLOWED_FILE_EXTENSIONS, ALLOWED_MIME_TYPES } from '../constants';

/**
 * Hook cung cấp các hàm validate và filter files
 * 
 * @returns {Object} Các hàm validation
 */
const useFileValidation = () => {
    /**
     * Kiểm tra file có được phép không
     */
    const isAllowedFile = useCallback((file) => {
        // Check theo MIME Type
        if (ALLOWED_MIME_TYPES.includes(file.type)) return true;

        // Check theo extension (fallback)
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ALLOWED_FILE_EXTENSIONS.includes(ext);
    }, []);

    /**
     * Lọc và validate danh sách files
     * @param {FileList|Array} files - Danh sách files
     * @param {Object} options - Tùy chọn
     * @returns {Array} Danh sách files hợp lệ
     */
    const validateFiles = useCallback((files, options = {}) => {
        const {
            showWarning = true,
            context = 'file' // 'file' | 'folder'
        } = options;

        const allFiles = Array.from(files);
        const validFiles = allFiles.filter(isAllowedFile);
        const invalidCount = allFiles.length - validFiles.length;

        // Hiển thị cảnh báo nếu có file bị loại
        if (showWarning && invalidCount > 0) {
            if (context === 'folder' && validFiles.length === 0) {
                toast.error("Thư mục không chứa tệp PDF hoặc Word nào.");
            } else if (context === 'folder') {
                toast.info(`Đang tải lên ${validFiles.length} tệp hợp lệ trong thư mục. `);
            } else {
                toast.warning(
                    `Đã bỏ qua ${invalidCount} tệp không hỗ trợ (Chỉ chấp nhận PDF, Word).`
                );
            }
        }

        return validFiles;
    }, [isAllowedFile]);

    return {
        isAllowedFile,
        validateFiles
    };
};

export default useFileValidation;