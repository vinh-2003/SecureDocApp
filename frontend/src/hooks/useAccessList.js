import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import fileService from '../services/fileService';

/**
 * Hook quản lý danh sách quyền truy cập
 * 
 * @param {string} fileId - ID của file
 * @param {boolean} isOpen - Modal có đang mở không
 * @returns {Object} State và handlers
 */
const useAccessList = (fileId, isOpen) => {
    const [accessList, setAccessList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // State cho modal xác nhận
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const [targetRevoke, setTargetRevoke] = useState(null);

    // Fetch danh sách quyền
    const fetchAccessList = useCallback(async () => {
        if (!fileId) return;

        try {
            setLoading(true);
            const res = await fileService.getGrantedAccessList(fileId);
            if (res.success) {
                setAccessList(res.data);
            }
        } catch (error) {
            toast.error("Lỗi tải danh sách quyền.");
        } finally {
            setLoading(false);
        }
    }, [fileId]);

    // Fetch khi mở modal
    useEffect(() => {
        if (isOpen && fileId) {
            fetchAccessList();
            setSearchTerm(''); // Reset search
        }
    }, [isOpen, fileId, fetchAccessList]);

    // Nhóm dữ liệu theo user
    const groupedUsers = useMemo(() => {
        const groups = {};

        accessList.forEach(item => {
            if (!groups[item.userId]) {
                groups[item.userId] = {
                    userId: item.userId,
                    fullName: item.userFullName,
                    email: item.userEmail,
                    avatar: item.userAvatar,
                    pages: []
                };
            }
            groups[item.userId].pages.push(item.pageIndex);
        });

        // Filter theo search term
        return Object.values(groups).filter(user =>
            user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [accessList, searchTerm]);

    // Mở modal xác nhận thu hồi
    const openRevokeConfirm = useCallback((userId, pageIndex) => {
        setTargetRevoke({ userId, pageIndex });
        setConfirmOpen(true);
    }, []);

    // Đóng modal xác nhận
    const closeRevokeConfirm = useCallback(() => {
        setConfirmOpen(false);
        setTargetRevoke(null);
    }, []);

    // Thực hiện thu hồi quyền
    const confirmRevoke = useCallback(async () => {
        if (!targetRevoke) return;

        const { userId, pageIndex } = targetRevoke;
        setRevoking(true);

        try {
            const res = await fileService.revokePageAccess(fileId, userId, pageIndex);
            if (res.success) {
                toast.success(`Đã thu hồi quyền trang ${pageIndex + 1}`);

                // Cập nhật local state
                setAccessList(prev =>
                    prev.filter(item => !(item.userId === userId && item.pageIndex === pageIndex))
                );

                closeRevokeConfirm();
            }
        } catch (error) {
            toast.error("Thu hồi thất bại.  Vui lòng thử lại.");
        } finally {
            setRevoking(false);
        }
    }, [fileId, targetRevoke, closeRevokeConfirm]);

    return {
        // Data
        accessList,
        groupedUsers,
        loading,
        searchTerm,

        // Confirm modal state
        confirmOpen,
        revoking,
        targetRevoke,

        // Actions
        setSearchTerm,
        openRevokeConfirm,
        closeRevokeConfirm,
        confirmRevoke,
        refetch: fetchAccessList
    };
};

export default useAccessList;