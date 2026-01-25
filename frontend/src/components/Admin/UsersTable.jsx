import React from 'react';
import { FaLock, FaUnlock, FaUserShield, FaUserCircle, FaEnvelope } from 'react-icons/fa';
import { formatDate } from '../../utils/format';
import UserStatusBadge from './UserStatusBadge';

const UsersTable = ({ 
    users, 
    pagination, 
    onPageChange, 
    onRoleClick, 
    onLockClick, 
    onResendEmailClick 
}) => {
    if (!users || users.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                Không tìm thấy người dùng nào.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-3 border-b">User</th>
                            <th className="px-6 py-3 border-b hidden md:table-cell">Email</th>
                            <th className="px-6 py-3 border-b">Vai trò</th>
                            <th className="px-6 py-3 border-b text-center">Trạng thái</th>
                            <th className="px-6 py-3 border-b hidden lg:table-cell">Ngày tham gia</th>
                            <th className="px-6 py-3 border-b text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-blue-50/50 transition-colors">
                                {/* User Info */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {u.avatarUrl ? (
                                            <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border" />
                                        ) : (
                                            <FaUserCircle className="w-10 h-10 text-gray-300" />
                                        )}
                                        <div>
                                            <div className="font-medium text-gray-900">{u.username}</div>
                                            <div className="text-xs text-gray-500 md:hidden">{u.email}</div>
                                        </div>
                                    </div>
                                </td>

                                {/* Email */}
                                <td className="px-6 py-4 hidden md:table-cell text-gray-600 text-sm">
                                    {u.email}
                                </td>

                                {/* Roles */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {u.roles.includes('ROLE_ADMIN') && (
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                                Admin
                                            </span>
                                        )}
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                            User
                                        </span>
                                    </div>
                                </td>

                                {/* Status Badge */}
                                <td className="px-6 py-4 text-center">
                                    <UserStatusBadge user={u} />
                                </td>

                                {/* Date */}
                                <td className="px-6 py-4 hidden lg:table-cell text-gray-500 text-sm">
                                    {formatDate(u.createdAt)}
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* 1. Resend Email (Chỉ hiện nếu chưa active) */}
                                        {!u.isEnabled && (
                                            <button
                                                onClick={() => onResendEmailClick(u)}
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Gửi lại email kích hoạt"
                                            >
                                                <FaEnvelope size={16} />
                                            </button>
                                        )}

                                        {/* 2. Role Button */}
                                        <button 
                                            onClick={() => onRoleClick(u)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Phân quyền"
                                        >
                                            <FaUserShield size={16} />
                                        </button>

                                        {/* 3. Lock/Unlock Button */}
                                        <button 
                                            onClick={() => onLockClick(u)}
                                            className={`p-2 rounded-lg transition-colors ${
                                                u.accountNonLocked 
                                                    ? 'text-red-500 hover:bg-red-50' 
                                                    : 'text-green-600 hover:bg-green-50'
                                            }`}
                                            title={u.accountNonLocked ? 'Vô hiệu hóa tài khoản' : 'Mở khóa tài khoản'}
                                        >
                                            {u.accountNonLocked ? <FaLock size={16} /> : <FaUnlock size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                    <span className="text-sm text-gray-600">
                        Trang {pagination.page + 1} / {pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 0}
                            className="px-3 py-1 rounded border bg-white disabled:opacity-50 text-sm hover:bg-gray-50"
                        >
                            Trước
                        </button>
                        <button
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages - 1}
                            className="px-3 py-1 rounded border bg-white disabled:opacity-50 text-sm hover:bg-gray-50"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersTable;