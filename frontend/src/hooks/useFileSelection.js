import { useState, useCallback } from 'react';

/**
 * Hook quản lý việc chọn file/folder
 * Hỗ trợ:  Chọn đơn, chọn nhiều (Ctrl), chọn theo dải (Shift), chọn tất cả
 * 
 * @param {Array} files - Danh sách files hiện tại
 * @returns {Object} - State và handlers cho việc chọn file
 */
const useFileSelection = (files = []) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

    /**
     * Kiểm tra file có đang được chọn không
     * @param {Object} file - File cần kiểm tra
     * @returns {boolean}
     */
    const isSelected = useCallback((file) => {
        return selectedFiles.some(f => f.id === file.id);
    }, [selectedFiles]);

    /**
     * Chọn/Bỏ chọn một file (Toggle)
     * @param {Event} e - Sự kiện click
     * @param {Object} file - File được click
     */
    const toggleSelect = useCallback((e, file) => {
        e?.stopPropagation();

        setSelectedFiles(prev => {
            const isCurrentlySelected = prev.some(f => f.id === file.id);
            if (isCurrentlySelected) {
                return prev.filter(f => f.id !== file.id);
            } else {
                return [...prev, file];
            }
        });
    }, []);

    /**
     * Chọn duy nhất một file (Clear selection cũ)
     * @param {Object} file - File được chọn
     * @param {number} index - Vị trí trong danh sách
     */
    const selectSingle = useCallback((file, index) => {
        setSelectedFiles([file]);
        setLastSelectedIndex(index);
    }, []);

    /**
     * Chọn thêm/bỏ chọn file (Ctrl+Click)
     * @param {Event} e - Sự kiện click
     * @param {Object} file - File được click
     * @param {number} index - Vị trí trong danh sách
     */
    const selectWithCtrl = useCallback((e, file, index) => {
        toggleSelect(e, file);
        setLastSelectedIndex(index);
    }, [toggleSelect]);

    /**
     * Chọn theo dải (Shift+Click)
     * @param {number} index - Vị trí được click
     */
    const selectWithShift = useCallback((index) => {
        if (lastSelectedIndex === null) {
            // Nếu chưa có selection trước đó, chọn từ đầu đến index
            setSelectedFiles(files.slice(0, index + 1));
        } else {
            // Chọn từ lastSelectedIndex đến index
            const start = Math.min(lastSelectedIndex, index);
            const end = Math.max(lastSelectedIndex, index);
            setSelectedFiles(files.slice(start, end + 1));
        }
    }, [files, lastSelectedIndex]);

    /**
     * Chọn tất cả hoặc bỏ chọn tất cả
     */
    const selectAll = useCallback(() => {
        if (selectedFiles.length === files.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles([...files]);
        }
    }, [files, selectedFiles.length]);

    /**
     * Bỏ chọn tất cả
     */
    const clearSelection = useCallback(() => {
        setSelectedFiles([]);
        setLastSelectedIndex(null);
    }, []);

    /**
     * Set danh sách file được chọn (dùng cho Move, v.v.)
     * @param {Array} files - Danh sách files
     */
    const setSelection = useCallback((files) => {
        setSelectedFiles(files);
    }, []);

    /**
     * Kiểm tra có đang chọn file nào không
     * @returns {boolean}
     */
    const hasSelection = selectedFiles.length > 0;

    /**
     * Kiểm tra đã chọn tất cả chưa
     * @returns {boolean}
     */
    const isAllSelected = files.length > 0 && selectedFiles.length === files.length;

    /**
     * Số lượng file đang chọn
     * @returns {number}
     */
    const selectionCount = selectedFiles.length;

    return {
        // State
        selectedFiles,
        lastSelectedIndex,

        // Check functions
        isSelected,
        hasSelection,
        isAllSelected,
        selectionCount,

        // Actions
        toggleSelect,
        selectSingle,
        selectWithCtrl,
        selectWithShift,
        selectAll,
        clearSelection,
        setSelection,
        setSelectedFiles,
        setLastSelectedIndex
    };
};

export default useFileSelection;