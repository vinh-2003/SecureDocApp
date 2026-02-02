import { useState, useEffect, useCallback, useMemo } from 'react';
import Toast from 'react-native-toast-message';
import fileService from '../services/fileService';

/**
 * Hook quản lý logic yêu cầu mở khóa trang
 * 
 * @param {string} fileId - ID của file
 * @param {Array} pages - Danh sách tất cả các trang
 * @param {boolean} isOpen - Modal có đang mở không
 * @param {Function} onSuccess - Callback khi gửi thành công
 * @returns {Object} State và handlers
 */
const useAccessRequest = (fileId, pages = [], isOpen, onSuccess) => {
    const [selectedPages, setSelectedPages] = useState([]);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    // Lọc các trang bị khóa và chưa có quyền xem
    const lockedPages = useMemo(() => {
        return pages.filter(p => p.locked && !p.canViewClear);
    }, [pages]);

    // Reset state khi modal mở
    useEffect(() => {
        if (isOpen) {
            // Mặc định chọn tất cả trang bị khóa
            setSelectedPages(lockedPages.map(p => p.pageIndex));
            setReason('');
        }
    }, [isOpen, lockedPages]);

    // Toggle chọn/bỏ chọn trang
    const togglePage = useCallback((pageIndex) => {
        setSelectedPages(prev =>
            prev.includes(pageIndex)
                ? prev.filter(p => p !== pageIndex)
                : [...prev, pageIndex]
        );
    }, []);

    // Chọn tất cả
    const selectAll = useCallback(() => {
        setSelectedPages(lockedPages.map(p => p.pageIndex));
    }, [lockedPages]);

    // Bỏ chọn tất cả
    const deselectAll = useCallback(() => {
        setSelectedPages([]);
    }, []);

    // Validate form
    const validate = useCallback(() => {
        if (selectedPages.length === 0) {
            Toast.show({
                type: 'warning',
                text1: 'Cảnh báo',
                text2: 'Vui lòng chọn ít nhất một trang'
            });
            return false;
        }
        if (!reason.trim()) {
            Toast.show({
                type: 'warning',
                text1: 'Cảnh báo',
                text2: 'Vui lòng nhập lý do'
            });
            return false;
        }
        return true;
    }, [selectedPages, reason]);

    // Submit request
    const submit = useCallback(async () => {
        if (!validate()) return false;

        setLoading(true);
        try {
            const res = await fileService.createAccessRequest(
                fileId,
                selectedPages,
                reason.trim()
            );

            if (res.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Thành công',
                    text2: 'Đã gửi yêu cầu thành công!'
                });
                onSuccess?.();
                return true;
            }
        } catch (error) {
            console.error('Submit access request error:', error);
            const message = error.response?.data?.message || 'Gửi yêu cầu thất bại';
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: message
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [fileId, selectedPages, reason, validate, onSuccess]);

    // Reset form
    const reset = useCallback(() => {
        setSelectedPages([]);
        setReason('');
    }, []);

    return {
        // State
        selectedPages,
        reason,
        loading,
        lockedPages,

        // Computed
        hasLockedPages: lockedPages.length > 0,
        selectedCount: selectedPages.length,
        isAllSelected: selectedPages.length === lockedPages.length && lockedPages.length > 0,

        // Actions
        setReason,
        togglePage,
        selectAll,
        deselectAll,
        submit,
        reset
    };
};

export default useAccessRequest;