import React from 'react';
import { FaUserCircle, FaTimes } from 'react-icons/fa';

/**
 * Card hiển thị thông tin quyền truy cập của một user
 * 
 * @param {Object} user - Thông tin user
 * @param {string} user. userId - ID user
 * @param {string} user.fullName - Tên đầy đủ
 * @param {string} user.email - Email
 * @param {string} user.avatar - URL avatar
 * @param {Array<number>} user.pages - Danh sách index trang được phép xem
 * @param {Function} onRevoke - Callback thu hồi quyền (userId, pageIndex) => void
 */
const UserAccessCard = ({ user, onRevoke }) => {
    return (
        <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition">
            {/* User Info */}
            <div className="flex items-center gap-3 mb-3 border-b pb-3">
                {user.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <FaUserCircle size={24} />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-gray-800 text-sm truncate">
                        {user.fullName || 'Không có tên'}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
            </div>

            {/* Pages List */}
            <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    Các trang được phép xem ({user.pages.length})
                </p>
                <div className="flex flex-wrap gap-2">
                    {user.pages.sort((a, b) => a - b).map((pageIndex) => (
                        <PageAccessTag
                            key={pageIndex}
                            pageIndex={pageIndex}
                            onRevoke={() => onRevoke(user.userId, pageIndex)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * Tag hiển thị quyền truy cập một trang
 */
const PageAccessTag = ({ pageIndex, onRevoke }) => {
    return (
        <div className="group flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-medium hover:bg-green-100 transition">
            <span>Trang {pageIndex + 1}</span>
            <button
                onClick={onRevoke}
                className="w-4 h-4 flex items-center justify-center rounded-full text-green-500 hover:bg-red-500 hover:text-white transition"
                title="Thu hồi quyền trang này"
            >
                <FaTimes size={10} />
            </button>
        </div>
    );
};

export default UserAccessCard;