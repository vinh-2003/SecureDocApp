import React from 'react';

const UserStatusBadge = ({ user }) => {
    // 1. Chưa xác thực Email
    if (!user.enabled) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                Chưa kích hoạt
            </span>
        );
    }

    // 2. Tài khoản đang bị khóa
    if (!user.accountNonLocked) {
        // Nếu có lockTime => Khóa tạm thời do sai mật khẩu
        if (user.lockTime) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                    Tạm khóa (Security)
                </span>
            );
        }
        // Nếu không có lockTime => Admin khóa vĩnh viễn
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                Đã vô hiệu hóa
            </span>
        );
    }

    // 3. Hoạt động bình thường
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            Hoạt động
        </span>
    );
};

export default UserStatusBadge;