import React from 'react';
import {
    FaTimes, FaUserCircle,
    FaUserPlus, FaCaretDown, FaLink
} from 'react-icons/fa';
import usePermissionHelpers from '../../hooks/usePermissionHelpers';
import { PublicAccessSelect, Loading } from '../Common';

/**
 * Modal chia sẻ file/folder
 * 
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {Function} onClose - Callback đóng modal
 * @param {Object} data - Dữ liệu file/folder đang chia sẻ
 * @param {boolean} loading - Trạng thái loading
 * @param {string} currentUserId - ID user hiện tại
 * @param {string} emailInput - Giá trị input email
 * @param {Function} onEmailChange - Callback khi thay đổi email
 * @param {string} permissionInput - Giá trị select permission
 * @param {Function} onPermissionChange - Callback khi thay đổi permission
 * @param {Function} onAddUser - Callback khi thêm user
 * @param {Function} onRevokeClick - Callback khi click xóa quyền
 * @param {Function} onUpdatePermission - Callback khi cập nhật quyền
 * @param {Function} onChangePublicAccess - Callback khi thay đổi public access
 * @param {Function} onCopyLink - Callback khi copy link
 */
const ShareModal = ({
    isOpen,
    onClose,
    data,
    loading = false,
    currentUserId,
    emailInput = '',
    onEmailChange,
    permissionInput = 'VIEWER',
    onPermissionChange,
    onAddUser,
    onRevokeClick,
    onUpdatePermission,
    onChangePublicAccess,
    onCopyLink
}) => {
    // Sử dụng hook để lấy các helper functions
    const { getPermissionLabel, getPermissionColor, isInheritedPermission } = usePermissionHelpers();

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onAddUser) onAddUser(e);
    };

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-xl shadow-2xl w-[550px] max-h-[90vh] flex flex-col animate-fade-in-down overflow-hidden">

                {/* 1. Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                            <FaUserPlus size={16} />
                        </div>
                        <span className="truncate max-w-[350px]" title={data?.name}>
                            Chia sẻ "{data?.name}"
                        </span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-10 flex justify-center"><Loading /></div>
                ) : data ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                        {/* 2. Form thêm người */}
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition shadow-sm">
                                <input
                                    type="email"
                                    placeholder="Nhập email người nhận..."
                                    className="flex-1 px-3 py-2.5 outline-none text-sm text-gray-700"
                                    value={emailInput}
                                    onChange={(e) => onEmailChange(e.target.value)}
                                    required
                                />

                                <div className="w-[1px] h-6 bg-gray-200"></div>

                                <div className="relative">
                                    <select
                                        className="appearance-none bg-transparent pl-3 pr-8 py-2.5 text-sm font-semibold text-gray-600 outline-none cursor-pointer hover:text-blue-600 transition"
                                        value={permissionInput}
                                        onChange={(e) => onPermissionChange(e.target.value)}
                                    >
                                        <option value="VIEWER">Người xem</option>
                                        <option value="COMMENTER">Người nhận xét</option>
                                        <option value="EDITOR">Người chỉnh sửa</option>
                                    </select>
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                                        <FaCaretDown size={12} />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap shadow-sm transition transform active:scale-95"
                            >
                                Gửi
                            </button>
                        </form>

                        {/* 3. Danh sách người có quyền truy cập */}
                        <div className="mt-2">
                            <p className="text-sm font-semibold text-gray-700 mb-3">
                                Những người có quyền truy cập
                            </p>
                            <div className="space-y-3">

                                {/* A. Chủ sở hữu */}
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition">
                                    <div className="flex items-center gap-3">
                                        {data.owner?.avatarUrl ? (
                                            <img
                                                src={data.owner.avatarUrl}
                                                alt="owner"
                                                className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                                            />
                                        ) : (
                                            <FaUserCircle className="text-gray-300 w-10 h-10" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {data.owner?.name}
                                                {data.owner?.id === currentUserId && (
                                                    <span className="text-gray-400 font-normal ml-1">(bạn)</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500">{data.owner?.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 italic px-3 py-1 bg-gray-100 rounded-full">
                                        Chủ sở hữu
                                    </span>
                                </div>

                                {/* B. Danh sách được chia sẻ */}
                                {data.sharedWith?.map((perm, idx) => {
                                    const isInherited = isInheritedPermission(perm.permissionType);
                                    const isMe = perm.user?.id === currentUserId;

                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition group"
                                        >
                                            {/* Thông tin User */}
                                            <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                                                {perm.user?.avatarUrl ? (
                                                    <img
                                                        src={perm.user.avatarUrl}
                                                        alt="user"
                                                        className="w-10 h-10 rounded-full border border-gray-200 object-cover shrink-0"
                                                    />
                                                ) : (
                                                    <FaUserCircle className="text-gray-300 w-10 h-10 shrink-0" />
                                                )}

                                                <div className="truncate">
                                                    <p className="text-sm font-medium text-gray-800 truncate" title={perm.user?.name}>
                                                        {perm.user?.name}
                                                        {isMe && <span className="text-gray-400 font-normal ml-1">(bạn)</span>}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate" title={perm.user?.email}>
                                                        {perm.user?.email}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Điều khiển */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Nút xóa quyền */}
                                                {!isInherited && (
                                                    <button
                                                        onClick={() => onRevokeClick(perm.user)}
                                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100"
                                                        title="Gỡ bỏ quyền truy cập"
                                                    >
                                                        <FaTimes size={14} />
                                                    </button>
                                                )}

                                                {/* Badge Select */}
                                                <div className={`relative px-2 py-1.5 rounded-full border flex items-center gap-1 transition-colors ${getPermissionColor(perm.permissionType)}`}>
                                                    {!isInherited && (
                                                        <select
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            value={perm.permissionType}
                                                            onChange={(e) => onUpdatePermission(perm.user.email, e.target.value)}
                                                        >
                                                            <option value="VIEWER">Người xem</option>
                                                            <option value="COMMENTER">Người nhận xét</option>
                                                            <option value="EDITOR">Người chỉnh sửa</option>
                                                        </select>
                                                    )}

                                                    <span className="text-xs font-bold min-w-[60px] text-center select-none pointer-events-none">
                                                        {getPermissionLabel(perm.permissionType)}
                                                    </span>

                                                    {!isInherited && (
                                                        <FaCaretDown size={10} className="pointer-events-none opacity-70" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 4. Quyền truy cập chung */}
                        <PublicAccessSelect
                            value={data.publicAccess}
                            onChange={onChangePublicAccess}
                        />
                    </div>
                ) : null}

                {/* 5. Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                    <button
                        onClick={onCopyLink}
                        className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                    >
                        <FaLink /> Sao chép liên kết
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                        Xong
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;