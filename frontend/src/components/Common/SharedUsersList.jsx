import React from 'react';
import { FaUserCircle } from 'react-icons/fa';
import usePermissionHelpers from '../../hooks/usePermissionHelpers';

/**
 * Component hiển thị danh sách người được chia sẻ (chỉ đọc)
 * Dùng cho: FileInfoModal
 * 
 * @param {Array} sharedWith - Danh sách người được chia sẻ
 * @param {string} currentUserId - ID user hiện tại (để hiển thị "(bạn)")
 * @param {string} className - Class bổ sung cho container
 * @param {number} maxHeight - Chiều cao tối đa của danh sách (default: 160px)
 */
const SharedUsersList = ({
    sharedWith = [],
    currentUserId,
    className = '',
    maxHeight = 160
}) => {
    const { getPermissionLabel, getPermissionColor } = usePermissionHelpers();

    if (!sharedWith || sharedWith.length === 0) {
        return (
            <p className={`text-sm text-gray-400 italic pl-1 ${className}`}>
                Chưa chia sẻ với ai.
            </p>
        );
    }

    return (
        <div className={`mt-2 ${className}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Đã chia sẻ ({sharedWith.length})
            </p>
            <div
                className="flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar"
                style={{ maxHeight: `${maxHeight}px` }}
            >
                {sharedWith.map((perm, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition"
                    >
                        {/* Thông tin User */}
                        <div className="flex items-center gap-2 overflow-hidden">
                            {perm.user?.avatarUrl ? (
                                <img
                                    src={perm.user.avatarUrl}
                                    alt="avatar"
                                    className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                />
                            ) : (
                                <FaUserCircle className="text-gray-300 w-9 h-9" />
                            )}
                            <div className="truncate">
                                <p className="text-sm font-medium text-gray-800 truncate" title={perm.user?.name}>
                                    {perm.user?.name}
                                    {perm.user?.id === currentUserId && (
                                        <span className="text-gray-400 font-normal ml-1">(bạn)</span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 truncate" title={perm.user?.email}>
                                    {perm.user?.email}
                                </p>
                            </div>
                        </div>

                        {/* Badge Quyền */}
                        <span className={`text-xs font-bold px-2 py-1.5 rounded-full border min-w-[90px] text-center select-none ${getPermissionColor(perm.permissionType)}`}>
                            {getPermissionLabel(perm.permissionType)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SharedUsersList;