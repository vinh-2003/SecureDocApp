import React from 'react';
import { FaGlobeAsia, FaLock } from 'react-icons/fa';

/**
 * Component hiển thị trạng thái quyền truy cập công khai (chỉ đọc)
 * Dùng cho:  FileInfoModal, các nơi chỉ cần hiển thị thông tin
 * 
 * @param {string} publicAccess - Giá trị quyền truy cập ('PRIVATE' | 'PUBLIC_VIEW' | 'PUBLIC_EDIT')
 * @param {string} className - Class bổ sung cho container
 */
const PublicAccessBadge = ({ publicAccess, className = '' }) => {
    const isPrivate = publicAccess === 'PRIVATE';

    const getDescription = () => {
        switch (publicAccess) {
            case 'PRIVATE':
                return 'Chỉ những người được thêm mới có thể mở. ';
            case 'PUBLIC_VIEW':
                return 'Bất kỳ ai có liên kết đều có thể xem.';
            case 'PUBLIC_EDIT':
                return 'Bất kỳ ai có liên kết đều có thể chỉnh sửa.';
            default:
                return '';
        }
    };

    return (
        <div className={`flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 ${className}`}>
            <div className="flex items-center gap-2">
                {isPrivate ? (
                    <div className="p-1.5 bg-gray-200 rounded-full text-gray-600">
                        <FaLock size={12} />
                    </div>
                ) : (
                    <div className="p-1.5 bg-green-200 rounded-full text-green-700">
                        <FaGlobeAsia size={12} />
                    </div>
                )}
                <div>
                    <p className="text-sm font-medium text-gray-800">
                        {isPrivate ? 'Riêng tư' : 'Công khai'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {getDescription()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicAccessBadge;