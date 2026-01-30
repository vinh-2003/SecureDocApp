import React from 'react';
import { FaUserCheck, FaExclamationCircle, FaSpinner, FaTimes, FaUserCircle } from 'react-icons/fa';

/**
 * Component tìm kiếm và hiển thị user
 */
const UserSearchInput = ({
    searchEmail,
    onSearchChange,
    foundUser,
    isLoading,
    error,
    onClear,
    disabled = false
}) => {
    return (
        <div className="border p-4 rounded-lg bg-gray-50">
            <label className="block text-xs font-medium text-gray-500 mb-1">
                Người tạo (Email)
            </label>

            {/* Input */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Nhập email người dùng..."
                    className={`
                        w-full border rounded px-3 py-2 text-sm outline-none 
                        focus:ring-2 focus: ring-blue-500 pr-8 bg-white
                        ${error ? 'border-red-500' : 'border-gray-300'}
                    `}
                    value={searchEmail}
                    onChange={(e) => onSearchChange(e.target.value)}
                    disabled={disabled}
                />

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="absolute right-3 top-2.5 text-gray-400">
                        <FaSpinner className="animate-spin" />
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <FaExclamationCircle /> {error}
                </p>
            )}

            {/* Found User Card */}
            {foundUser && (
                <UserCard user={foundUser} onRemove={onClear} />
            )}
        </div>
    );
};

/**
 * Card hiển thị user đã tìm thấy
 */
const UserCard = ({ user, onRemove }) => {
    return (
        <div className="mt-2 flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
            {/* Avatar */}
            {user.avatarUrl ? (
                <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border object-cover"
                />
            ) : (
                <FaUserCircle className="w-8 h-8 text-gray-400" />
            )}

            {/* Info */}
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-gray-800 truncate">
                    {user.fullName || user.username}
                </p>
                <p className="text-xs text-gray-500 truncate">
                    {user.email}
                </p>
            </div>

            {/* Check Icon */}
            <FaUserCheck className="text-green-500 flex-shrink-0" />

            {/* Remove Button */}
            <button
                type="button"
                onClick={onRemove}
                className="text-gray-400 hover:text-red-500 p-1 transition"
                aria-label="Xóa user đã chọn"
            >
                <FaTimes />
            </button>
        </div>
    );
};

export default UserSearchInput;