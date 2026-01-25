import React, { useState } from 'react';
import {
    FaTimes, FaUserCircle, FaHistory,
    FaFolder, FaFilePdf, FaFileWord, FaFileAlt
} from 'react-icons/fa';
import { formatBytes, formatDate } from '../../utils/format';
import { Loading, PublicAccessBadge, SharedUsersList } from '../Common';
import { ActivityLogModal } from '../Activity';

/**
 * Modal hiển thị thông tin chi tiết file/folder
 */
const FileInfoModal = ({
    isOpen,
    onClose,
    data,
    loading = false,
    currentUserId
}) => {
    const [showActivityLog, setShowActivityLog] = useState(false);

    if (!isOpen) return null;

    // Helper lấy icon
    const getFileIcon = (file) => {
        if (!file) return <FaFileAlt className="text-gray-400 text-3xl" />;

        const { type, mimeType } = file;
        const className = "text-3xl";

        if (type === 'FOLDER') return <FaFolder className={`text-yellow-500 ${className}`} />;
        if (mimeType?.includes('pdf')) return <FaFilePdf className={`text-red-500 ${className}`} />;
        if (mimeType?.includes('word') || mimeType?.includes('document')) {
            return <FaFileWord className={`text-blue-500 ${className}`} />;
        }
        return <FaFileAlt className={`text-gray-400 ${className}`} />;
    };

    return (
        <>
            <div
                className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[80vh] overflow-hidden flex flex-col animate-fade-in-down">

                    {/* Header */}
                    <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-800">Thông tin chi tiết</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-200 rounded"
                        >
                            <FaTimes size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        {loading ? (
                            <div className="flex justify-center py-10"><Loading /></div>
                        ) : data ? (
                            <div className="space-y-6">
                                {/* 1. Header File:  Icon + Tên */}
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        {getFileIcon(data)}
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <p className="font-bold text-gray-800 text-lg truncate" title={data.name}>
                                            {data.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {data.mimeType || 'Thư mục'}
                                        </p>
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* 2. Thông tin chung */}
                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 mb-1">Loại</p>
                                        <p className="font-medium">
                                            {data.extension ? `Tệp ${data.extension.toUpperCase()}` : 'Thư mục'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Kích thước</p>
                                        <p className="font-medium">
                                            {data.type === 'FOLDER' ? '--' : formatBytes(data.size)}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500 mb-1">Vị trí</p>
                                        <div
                                            className="bg-gray-50 px-3 py-2 rounded text-gray-700 truncate border border-gray-100"
                                            title={data.locationPath}
                                        >
                                            {data.locationPath}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Ngày tạo</p>
                                        <p className="font-medium">{formatDate(data.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Cập nhật lần cuối</p>
                                        <p className="font-medium">{formatDate(data.updatedAt)}</p>
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* 3. Quyền & Sở hữu */}
                                <div className="space-y-4">
                                    {/* Chủ sở hữu */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Chủ sở hữu</span>
                                        <div className="flex items-center gap-2">
                                            {data.owner?.avatarUrl ? (
                                                <img src={data.owner.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                                            ) : (
                                                <FaUserCircle className="text-gray-300 w-6 h-6" />
                                            )}
                                            <span className="text-sm font-medium text-gray-800">
                                                {data.owner?.name || data.owner?.email}
                                                {data.owner?.id === currentUserId && (
                                                    <span className="text-gray-400 font-normal ml-1">(bạn)</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Người sửa cuối */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Sửa lần cuối bởi</span>
                                        <div className="flex items-center gap-2">
                                            {data.lastModifiedBy?.avatarUrl ? (
                                                <img src={data.lastModifiedBy.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                                            ) : (
                                                <FaUserCircle className="text-gray-300 w-6 h-6" />
                                            )}
                                            <span className="text-sm font-medium text-gray-800">
                                                {data.lastModifiedBy?.name || data.lastModifiedBy?.email}
                                                {data.lastModifiedBy?.id === currentUserId && (
                                                    <span className="text-gray-400 font-normal ml-1">(bạn)</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Trạng thái chia sẻ */}
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">Quyền truy cập</p>
                                        <div className="space-y-3">
                                            <PublicAccessBadge publicAccess={data.publicAccess} />
                                            <SharedUsersList
                                                sharedWith={data.sharedWith}
                                                currentUserId={currentUserId}
                                                maxHeight={160}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Mô tả */}
                                {data.description && (
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-gray-700 mt-2 break-words">
                                        <span className="font-semibold block mb-1 text-yellow-700">Mô tả:  </span>
                                        {data.description}
                                    </div>
                                )}

                                {/* 5. NÚT XEM LỊCH SỬ HOẠT ĐỘNG (MỚI) */}
                                <button
                                    onClick={() => setShowActivityLog(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
                                >
                                    <FaHistory />
                                    Xem lịch sử hoạt động
                                </button>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-10">Không có dữ liệu. </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>

            {/* Activity Log Modal */}
            <ActivityLogModal
                isOpen={showActivityLog}
                onClose={() => setShowActivityLog(false)}
                nodeId={data?.id}
                nodeName={data?.name}
            />
        </>
    );
};

export default FileInfoModal;