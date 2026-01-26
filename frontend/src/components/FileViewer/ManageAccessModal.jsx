import React from 'react';
import { FaTimes, FaSearch, FaShieldAlt } from 'react-icons/fa';

// Components
import { ConfirmModal, Loading } from '../Common';
import UserAccessCard from './UserAccessCard';

// Hooks
import { useAccessList } from '../../hooks';

/**
 * Modal quản lý quyền truy cập trang của file
 * 
 * @param {boolean} isOpen - Trạng thái mở/đóng
 * @param {Function} onClose - Callback đóng modal
 * @param {string} fileId - ID của file
 */
const ManageAccessModal = ({ isOpen, onClose, fileId }) => {
    // Sử dụng custom hook
    const {
        groupedUsers,
        loading,
        searchTerm,
        setSearchTerm,
        confirmOpen,
        revoking,
        targetRevoke,
        openRevokeConfirm,
        closeRevokeConfirm,
        confirmRevoke
    } = useAccessList(fileId, isOpen);

    if (!isOpen) return null;

    return (
        <>
            {/* MODAL CHÍNH */}
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">

                    {/* Header */}
                    <ModalHeader onClose={onClose} />

                    {/* Search Bar */}
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                    />

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/50">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loading />
                            </div>
                        ) : groupedUsers.length === 0 ? (
                            <EmptyState searchTerm={searchTerm} />
                        ) : (
                            <div className="space-y-4">
                                {groupedUsers.map((user) => (
                                    <UserAccessCard
                                        key={user.userId}
                                        user={user}
                                        onRevoke={openRevokeConfirm}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <ModalFooter
                        onClose={onClose}
                        totalUsers={groupedUsers.length}
                    />
                </div>
            </div>

            {/* MODAL XÁC NHẬN */}
            <ConfirmModal
                isOpen={confirmOpen}
                onClose={closeRevokeConfirm}
                onConfirm={confirmRevoke}
                title="Xác nhận thu hồi quyền"
                message={
                    <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn thu hồi quyền xem{' '}
                        <span className="font-semibold text-gray-700">
                            Trang {targetRevoke ? targetRevoke.pageIndex + 1 : ''}
                        </span>{' '}
                        của người dùng này không?
                    </p>
                }
                isLoading={revoking}
                variant="danger"
                confirmText="Thu hồi"
            />
        </>
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Header của modal
 */
const ModalHeader = ({ onClose }) => (
    <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <FaShieldAlt size={18} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800">
                    Quản lý quyền truy cập
                </h3>
                <p className="text-xs text-gray-500">
                    Kiểm soát ai đang xem trang nào của tài liệu này
                </p>
            </div>
        </div>
        <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
            <FaTimes size={18} />
        </button>
    </div>
);

/**
 * Search bar
 */
const SearchBar = ({ value, onChange }) => (
    <div className="p-4 border-b bg-white">
        <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    </div>
);

/**
 * Empty state
 */
const EmptyState = ({ searchTerm }) => (
    <div className="text-center py-10">
        <FaShieldAlt className="mx-auto text-4xl text-gray-300 mb-3" />
        <p className="text-gray-500 italic">
            {searchTerm
                ? "Không tìm thấy người dùng nào."
                : "Chưa có quyền nào được cấp (ngoài owner)."}
        </p>
    </div>
);

/**
 * Footer của modal
 */
const ModalFooter = ({ onClose, totalUsers }) => (
    <div className="px-4 py-3 border-t bg-gray-50 flex justify-between items-center">
        <span className="text-xs text-gray-500">
            {totalUsers > 0 && `${totalUsers} người dùng có quyền truy cập`}
        </span>
        <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
            Đóng
        </button>
    </div>
);

export default ManageAccessModal;