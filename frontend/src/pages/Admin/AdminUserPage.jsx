import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaSearch } from 'react-icons/fa';

// Imports
import { useAdminUsers } from '../../hooks';
import { Loading, ConfirmModal } from '../../components/Common';
import { RoleModal, UsersTable } from '../../components/Admin';

import adminService from '../../services/adminService';
import authService from '../../services/authService';

const AdminUserPage = () => {
    // --- 1. USE CUSTOM HOOK ---
    const {
        users, loading, pagination,
        setKeyword, fetchUsers, refreshData
    } = useAdminUsers();

    // --- 2. LOCAL STATE FOR MODALS ---
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, data: null });
    const [roleModal, setRoleModal] = useState({ isOpen: false, data: null });
    const [actionLoading, setActionLoading] = useState(false);

    // Initial Fetch (triggered by hook internal logic if needed, or here)
    useEffect(() => {
        fetchUsers(0, '');
    }, [fetchUsers]);

    // --- 3. HANDLERS ---

    // A. LOCK / UNLOCK
    const handleLockClick = (user) => {
        const isLocking = user.accountNonLocked; // True (đang mở) -> Cần khóa
        setConfirmModal({
            isOpen: true,
            type: 'LOCK_STATUS',
            data: user,
            title: isLocking ? 'Vô hiệu hóa tài khoản' : 'Mở khóa tài khoản',
            message: isLocking
                ? `Bạn có chắc chắn muốn vô hiệu hóa tài khoản "${user.username}"?`
                : `Mở khóa tài khoản cho "${user.username}"?`,
            variant: isLocking ? 'danger' : 'success',
            confirmText: isLocking ? 'Vô hiệu hóa' : 'Mở khóa'
        });
    };

    // B. RESEND EMAIL
    const handleResendEmailClick = (user) => {
        setConfirmModal({
            isOpen: true,
            type: 'RESEND_EMAIL',
            data: user,
            title: 'Gửi lại email kích hoạt',
            message: `Gửi lại email xác thực tới "${user.email}"?`,
            variant: 'info',
            confirmText: 'Gửi ngay'
        });
    };

    // C. CONFIRM ACTION (Chung cho Lock & Resend)
    const handleConfirmAction = async () => {
        const { type, data: user } = confirmModal;
        setActionLoading(true);
        try {
            if (type === 'LOCK_STATUS') {
                const shouldLock = user.accountNonLocked;
                await adminService.updateUserStatus(user.id, shouldLock);
                toast.success(shouldLock ? 'Đã vô hiệu hóa tài khoản' : 'Đã mở khóa tài khoản');
                refreshData();
            } else if (type === 'RESEND_EMAIL') {
                await authService.resendVerification(user.email);
                toast.success(`Đã gửi email tới ${user.email}`);
            }
            setConfirmModal({ isOpen: false, type: null, data: null });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setActionLoading(false);
        }
    };

    // D. UPDATE ROLES
    const handleRoleUpdate = async (newRoles) => {
        setActionLoading(true);
        try {
            await adminService.updateUserRoles(roleModal.data.id, newRoles);
            toast.success('Cập nhật quyền thành công');
            refreshData();
            setRoleModal({ isOpen: false, data: null });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi cập nhật quyền');
        } finally {
            setActionLoading(false);
        }
    };

    // --- 4. RENDER ---
    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Page Header */}
            <div className="bg-white border-b px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h1>
                        <p className="text-sm text-gray-500">
                            Tổng số: {pagination.totalElements} người dùng
                        </p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email..."
                            onChange={(e) => setKeyword(e.target.value)} // Debounced in Hook
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Page Content */}
            <div className="flex-1 p-6 overflow-auto">
                {loading ? (
                    <Loading variant="inline" text="Đang tải danh sách..." />
                ) : (
                    <UsersTable
                        users={users}
                        pagination={pagination}
                        onPageChange={(p) => fetchUsers(p)}
                        onRoleClick={(u) => setRoleModal({ isOpen: true, data: u })}
                        onLockClick={handleLockClick}
                        onResendEmailClick={handleResendEmailClick}
                    />
                )}
            </div>

            {/* --- Modals --- */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                confirmText={confirmModal.confirmText}
                isLoading={actionLoading}
            />

            <RoleModal
                isOpen={roleModal.isOpen}
                onClose={() => setRoleModal({ isOpen: false, data: null })}
                onConfirm={handleRoleUpdate}
                initialRoles={roleModal.data?.roles}
                isLoading={actionLoading}
            />
        </div>
    );
};

export default AdminUserPage;