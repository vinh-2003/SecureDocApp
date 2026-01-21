import { useRef, useCallback } from 'react';

/**
 * Hook xử lý các sự kiện click vào file/folder
 * Hỗ trợ:  Single click, Double click, Ctrl+Click, Shift+Click
 * 
 * @param {Object} options - Các callback và config
 * @param {Function} options.onSingleClick - Callback khi click đơn (chọn file)
 * @param {Function} options. onDoubleClick - Callback khi double click (mở file/folder)
 * @param {Function} options.onCtrlClick - Callback khi Ctrl+Click (chọn thêm/bỏ chọn)
 * @param {Function} options.onShiftClick - Callback khi Shift+Click (chọn theo dải)
 * @param {number} options.clickDelay - Thời gian delay để phân biệt single/double click (default: 250ms)
 * 
 * @returns {Object} - Các handler cho sự kiện click
 */
const useFileClick = (options = {}) => {
    const {
        onSingleClick,
        onDoubleClick,
        onCtrlClick,
        onShiftClick,
        clickDelay = 250
    } = options;

    const clickTimeoutRef = useRef(null);

    /**
     * Xử lý click thông minh - phân biệt single click và double click
     * @param {Event} e - Sự kiện click
     * @param {Object} file - Object file/folder được click
     * @param {number} index - Vị trí của file trong danh sách
     */
    const handleSmartClick = useCallback((e, file, index) => {
        // Nếu click vào checkbox hoặc nút 3 chấm thì xử lý ngay
        if (e.target.closest('button') || e.target.closest('.checkbox-area')) {
            handleRowClick(e, file, index);
            return;
        }

        // Nếu đã có timer đang chạy (double click) -> Hủy timer cũ
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            return; // Để sự kiện onDoubleClick tự xử lý
        }

        // Tạo timer mới:  Đợi clickDelay ms
        clickTimeoutRef.current = setTimeout(() => {
            handleRowClick(e, file, index);
            clickTimeoutRef.current = null;
        }, clickDelay);
        // eslint-disable-next-line
    }, [clickDelay, onSingleClick, onCtrlClick, onShiftClick]);

    /**
     * Xử lý double click
     * @param {Object} file - Object file/folder được click
     */
    const handleDoubleClick = useCallback((file) => {
        // Xóa timer nếu đang chờ
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        if (onDoubleClick) {
            onDoubleClick(file);
        }
    }, [onDoubleClick]);

    /**
     * Xử lý click vào row (hỗ trợ Ctrl và Shift)
     * @param {Event} e - Sự kiện click
     * @param {Object} file - Object file/folder được click
     * @param {number} index - Vị trí của file trong danh sách
     */
    const handleRowClick = useCallback((e, file, index) => {
        // Nếu click vào nút 3 chấm hoặc checkbox thì không xử lý
        if (e.target.closest('button') || e.target.closest('.checkbox-area')) return;

        // Shift + Click (chọn theo dải)
        if (e.shiftKey) {
            if (onShiftClick) {
                onShiftClick(e, file, index);
            }
            // Ngăn chọn văn bản mặc định
            window.getSelection().removeAllRanges();
            return;
        }

        // Ctrl + Click hoặc Cmd + Click (chọn thêm/bỏ chọn)
        if (e.ctrlKey || e.metaKey) {
            if (onCtrlClick) {
                onCtrlClick(e, file, index);
            }
            return;
        }

        // Click thường (chọn duy nhất)
        if (onSingleClick) {
            onSingleClick(e, file, index);
        }
        // eslint-disable-next-line
    }, [onSingleClick, onCtrlClick, onShiftClick]);

    /**
     * Cleanup timer khi component unmount
     */
    const cleanup = useCallback(() => {
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }
    }, []);

    return {
        handleSmartClick,
        handleDoubleClick,
        handleRowClick,
        cleanup
    };
};

export default useFileClick;