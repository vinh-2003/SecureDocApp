import React from 'react';
import { FaCheckSquare, FaSquare, FaEllipsisV, FaRedo, FaUserCircle } from 'react-icons/fa';
import { formatBytes, formatDate, formatRelativeTime } from '../../utils/format';
import { useFileIcon } from '../../hooks';

/**
 * Cấu hình các thông tin có thể hiển thị trên card
 */
export const GRID_INFO = {
    SIZE: 'size',
    OWNER: 'owner',
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
    SHARED_AT: 'sharedAt',
    DELETED_AT: 'deletedAt',
    ACCESSED_AT: 'accessedAt',
    STATUS: 'status'
};

/**
 * Cấu hình mặc định cho thông tin hiển thị
 */
export const DEFAULT_GRID_INFO = [GRID_INFO.SIZE];

/**
 * Component hiển thị danh sách file dạng lưới
 */
const FileGridView = ({
    files = [],
    visibleInfo = DEFAULT_GRID_INFO,
    showOwner = false,
    isSelected,
    onToggleSelect,
    onCardClick,
    onDoubleClick,
    onContextMenu,
    onMenuClick,
    onRetry,
    lastElementRef,
    useRelativeTime = false,
    className = ''
}) => {
    const { getFileIcon, isProcessing, isFailed } = useFileIcon();

    // Helper kiểm tra info có hiển thị không
    const showInfo = (info) => visibleInfo.includes(info);

    // Render thông tin phụ của file
    const renderFileInfo = (file) => {
        const fileIsProcessing = isProcessing(file);
        const fileIsFailed = isFailed(file);

        // Nếu đang xử lý
        if (fileIsProcessing) {
            return <span className="text-blue-500 italic">Đang xử lý...</span>;
        }

        // Nếu lỗi
        if (fileIsFailed) {
            return (
                <button
                    onClick={(e) => onRetry?.(e, file)}
                    className="flex items-center justify-center gap-1 text-red-500 hover:text-red-700 w-full"
                >
                    <span className="italic">Lỗi</span> <FaRedo size={12} />
                </button>
            );
        }

        // Thời điểm mở (ưu tiên cho RecentPage)
        if (showInfo(GRID_INFO.ACCESSED_AT) && file.accessedAt) {
            return useRelativeTime
                ? formatRelativeTime(file.accessedAt)
                : formatDate(file.accessedAt).split(' ')[0];
        }

        // Hiển thị thông tin bình thường
        if (file.type === 'FOLDER') {
            if (showInfo(GRID_INFO.SHARED_AT) && file.sharedAt) {
                return formatDate(file.sharedAt).split(' ')[0];
            }
            if (showInfo(GRID_INFO.DELETED_AT) && file.deletedAt) {
                return formatDate(file.deletedAt).split(' ')[0];
            }
            return formatDate(file.updatedAt).split(' ')[0];
        }

        if (showInfo(GRID_INFO.SIZE)) {
            return formatBytes(file.size);
        }

        if (showInfo(GRID_INFO.SHARED_AT) && file.sharedAt) {
            return formatDate(file.sharedAt).split(' ')[0];
        }

        if (showInfo(GRID_INFO.DELETED_AT) && file.deletedAt) {
            return formatDate(file.deletedAt).split(' ')[0];
        }

        if (showInfo(GRID_INFO.UPDATED_AT)) {
            return formatDate(file.updatedAt).split(' ')[0];
        }

        if (showInfo(GRID_INFO.OWNER)) {
            return file.ownerName || file.ownerEmail || 'Unknown';
        }

        return formatBytes(file.size);
    };

    // Render owner info
    const renderOwner = (file) => {
        if (!showOwner) return null;

        return (
            <div className="w-full pt-2 border-t flex items-center justify-center gap-1.5 mt-auto">
                {file.ownerAvatar ? (
                    <img
                        src={file.ownerAvatar}
                        alt={file.ownerName}
                        className="w-5 h-5 rounded-full object-cover"
                    />
                ) : (
                    <FaUserCircle className="text-gray-300 w-5 h-5" />
                )}
                <span
                    className="text-[10px] text-gray-500 truncate max-w-[100px]"
                    title={file.ownerName || file.ownerEmail}
                >
                    {file.ownerName || file.ownerEmail || 'Unknown'}
                </span>
            </div>
        );
    };

    // Render một card
    const renderCard = (file, index) => {
        const fileIsSelected = isSelected?.(file) || false;
        const fileIsProcessing = isProcessing(file);
        const fileIsFailed = isFailed(file);
        const isLastElement = index === files.length - 1;

        return (
            <div
                key={file.id}
                ref={isLastElement && lastElementRef ? lastElementRef : null}
                className={`p-4 rounded-lg border shadow-sm flex flex-col items-center text-center transition group select-none relative
                    ${fileIsSelected ? 'bg-blue-50 border-blue-500 shadow-md' : 'bg-white border-gray-200 hover:shadow-md'}
                    ${(fileIsProcessing || fileIsFailed) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={(e) => onCardClick?.(e, file, index)}
                onDoubleClick={() => onDoubleClick?.(file)}
                onContextMenu={(e) => onContextMenu?.(e, file)}
            >
                {/* Checkbox góc trái */}
                <div className={`absolute top-2 left-2 z-10 checkbox-area ${fileIsSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition`}>
                    <button onClick={(e) => onToggleSelect?.(e, file)}>
                        {fileIsSelected
                            ? <FaCheckSquare className="text-blue-600 text-lg bg-white rounded-sm" />
                            : <FaSquare className="text-gray-300 text-lg hover:text-gray-400" />
                        }
                    </button>
                </div>

                {/* Nút 3 chấm góc phải */}
                <button
                    onClick={(e) => onMenuClick?.(e, file)}
                    className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition z-10"
                >
                    <FaEllipsisV />
                </button>

                {/* Icon file */}
                <div className="mt-2 mb-3 transform group-hover:scale-110 transition duration-200">
                    {getFileIcon(file, true)}
                </div>

                {/* Tên file */}
                <p className="text-sm font-medium text-gray-800 truncate w-full px-1 mb-1" title={file.name}>
                    {file.name}
                </p>

                {/* Thông tin phụ */}
                <p className="text-xs text-gray-500">
                    {renderFileInfo(file)}
                </p>

                {/* Owner (nếu hiển thị) */}
                {renderOwner(file)}
            </div>
        );
    };

    return (
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in ${className}`}>
            {files.map((file, index) => renderCard(file, index))}
        </div>
    );
};

export default FileGridView;