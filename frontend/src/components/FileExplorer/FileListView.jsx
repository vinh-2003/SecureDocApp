import React from 'react';
import { FaCheckSquare, FaSquare, FaEllipsisV, FaRedo, FaUserCircle } from 'react-icons/fa';
import { formatBytes, formatDate, formatRelativeTime } from '../../utils/format';
import { useFileIcon } from '../../hooks';

/**
 * Cấu hình các cột có thể hiển thị
 */
export const LIST_COLUMNS = {
    CHECKBOX: 'checkbox',
    NAME: 'name',
    SIZE: 'size',
    OWNER: 'owner',
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
    SHARED_AT: 'sharedAt',
    DELETED_AT: 'deletedAt',
    ACCESSED_AT: 'accessedAt',  // Thời điểm mở (cho RecentPage)
    STATUS: 'status',
    ACTIONS: 'actions'
};

/**
 * Cấu hình mặc định cho các cột
 */
export const DEFAULT_COLUMNS = [
    LIST_COLUMNS.CHECKBOX,
    LIST_COLUMNS.NAME,
    LIST_COLUMNS.SIZE,
    LIST_COLUMNS.UPDATED_AT,
    LIST_COLUMNS.ACTIONS
];

/**
 * Cấu hình label cho header các cột
 */
const COLUMN_HEADERS = {
    [LIST_COLUMNS.CHECKBOX]: '',
    [LIST_COLUMNS.NAME]: 'Tên',
    [LIST_COLUMNS.SIZE]: 'Kích thước',
    [LIST_COLUMNS.OWNER]: 'Chủ sở hữu',
    [LIST_COLUMNS.CREATED_AT]: 'Ngày tạo',
    [LIST_COLUMNS.UPDATED_AT]: 'Ngày sửa đổi',
    [LIST_COLUMNS.SHARED_AT]: 'Ngày chia sẻ',
    [LIST_COLUMNS.DELETED_AT]: 'Ngày xóa',
    [LIST_COLUMNS.ACCESSED_AT]: 'Thời điểm mở',
    [LIST_COLUMNS.STATUS]: 'Trạng thái',
    [LIST_COLUMNS.ACTIONS]: '#'
};

/**
 * Component hiển thị danh sách file dạng bảng
 */
const FileListView = ({
    files = [],
    visibleColumns = DEFAULT_COLUMNS,
    isSelected,
    isAllSelected = false,
    onSelectAll,
    onToggleSelect,
    onRowClick,
    onDoubleClick,
    onContextMenu,
    onMenuClick,
    onRetry,
    lastElementRef,
    columnLabels = {},
    useRelativeTime = false,  // Sử dụng thời gian tương đối (vd: "5 phút trước")
    className = ''
}) => {
    const { getFileIcon, isProcessing, isFailed } = useFileIcon();

    // Helper kiểm tra cột có hiển thị không
    const showColumn = (column) => visibleColumns.includes(column);

    // Helper lấy label cho cột
    const getColumnLabel = (column) => columnLabels[column] || COLUMN_HEADERS[column] || '';

    // Helper format thời gian
    const formatTime = (date, relative = false) => {
        if (!date) return '--';
        if (relative && formatRelativeTime) {
            return formatRelativeTime(date);
        }
        return formatDate(date);
    };

    // Render header của bảng
    const renderHeader = () => (
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
            <tr>
                {showColumn(LIST_COLUMNS.CHECKBOX) && (
                    <th className="px-4 py-3 border-b w-10 text-center">
                        <button onClick={onSelectAll} className="text-gray-400 hover:text-blue-600">
                            {isAllSelected
                                ? <FaCheckSquare className="text-blue-600 text-lg" />
                                : <FaSquare className="text-lg" />
                            }
                        </button>
                    </th>
                )}

                {showColumn(LIST_COLUMNS.NAME) && (
                    <th className="px-6 py-3 border-b">{getColumnLabel(LIST_COLUMNS.NAME)}</th>
                )}

                {showColumn(LIST_COLUMNS.SIZE) && (
                    <th className="px-6 py-3 border-b hidden sm:table-cell">{getColumnLabel(LIST_COLUMNS.SIZE)}</th>
                )}

                {showColumn(LIST_COLUMNS.OWNER) && (
                    <th className="px-6 py-3 border-b hidden md:table-cell">{getColumnLabel(LIST_COLUMNS.OWNER)}</th>
                )}

                {showColumn(LIST_COLUMNS.CREATED_AT) && (
                    <th className="px-6 py-3 border-b hidden lg:table-cell">{getColumnLabel(LIST_COLUMNS.CREATED_AT)}</th>
                )}

                {showColumn(LIST_COLUMNS.UPDATED_AT) && (
                    <th className="px-6 py-3 border-b hidden md:table-cell">{getColumnLabel(LIST_COLUMNS.UPDATED_AT)}</th>
                )}

                {showColumn(LIST_COLUMNS.SHARED_AT) && (
                    <th className="px-6 py-3 border-b hidden md:table-cell">{getColumnLabel(LIST_COLUMNS.SHARED_AT)}</th>
                )}

                {showColumn(LIST_COLUMNS.DELETED_AT) && (
                    <th className="px-6 py-3 border-b hidden md:table-cell">{getColumnLabel(LIST_COLUMNS.DELETED_AT)}</th>
                )}

                {showColumn(LIST_COLUMNS.ACCESSED_AT) && (
                    <th className="px-6 py-3 border-b hidden md:table-cell">{getColumnLabel(LIST_COLUMNS.ACCESSED_AT)}</th>
                )}

                {showColumn(LIST_COLUMNS.STATUS) && (
                    <th className="px-6 py-3 border-b hidden sm:table-cell">{getColumnLabel(LIST_COLUMNS.STATUS)}</th>
                )}

                {showColumn(LIST_COLUMNS.ACTIONS) && (
                    <th className="px-6 py-3 border-b text-right">{getColumnLabel(LIST_COLUMNS.ACTIONS)}</th>
                )}
            </tr>
        </thead>
    );

    // Render status badge
    const renderStatus = (file) => {
        if (isProcessing(file)) {
            return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Đang xử lý</span>;
        }
        if (isFailed(file)) {
            return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Lỗi</span>;
        }
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Sẵn sàng</span>;
    };

    // Render một row
    const renderRow = (file, index) => {
        const fileIsSelected = isSelected?.(file) || false;
        const fileIsProcessing = isProcessing(file);
        const fileIsFailed = isFailed(file);
        const isLastElement = index === files.length - 1;

        return (
            <tr
                key={file.id}
                ref={isLastElement && lastElementRef ? lastElementRef : null}
                onClick={(e) => onRowClick?.(e, file, index)}
                onDoubleClick={() => onDoubleClick?.(file)}
                onContextMenu={(e) => onContextMenu?.(e, file)}
                className={`transition border-b last:border-b-0 select-none group 
                    ${fileIsSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    ${(fileIsProcessing || fileIsFailed) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                {/* Checkbox */}
                {showColumn(LIST_COLUMNS.CHECKBOX) && (
                    <td className="px-4 py-4 text-center checkbox-area">
                        <button
                            onClick={(e) => onToggleSelect?.(e, file)}
                            className="text-gray-300 hover:text-blue-500"
                        >
                            {fileIsSelected
                                ? <FaCheckSquare className="text-blue-600 text-lg" />
                                : <FaSquare className="text-lg" />
                            }
                        </button>
                    </td>
                )}

                {/* Tên file */}
                {showColumn(LIST_COLUMNS.NAME) && (
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            {getFileIcon(file)}

                            <div className="flex flex-col min-w-0">
                                <span className="font-medium text-gray-900 truncate max-w-xs" title={file.name}>
                                    {file.name}
                                </span>
                                {fileIsProcessing && (
                                    <span className="text-xs text-blue-500 italic">Đang xử lý... </span>
                                )}
                                {fileIsFailed && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-red-500 italic">Lỗi xử lý</span>
                                        {onRetry && (
                                            <button
                                                onClick={(e) => onRetry(e, file)}
                                                className="text-xs flex items-center gap-1 text-gray-500 hover:text-blue-600 bg-gray-100 px-2 py-0. 5 rounded border transition"
                                                title="Thử xử lý lại"
                                            >
                                                <FaRedo size={10} /> Thử lại
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </td>
                )}

                {/* Kích thước */}
                {showColumn(LIST_COLUMNS.SIZE) && (
                    <td className="px-6 py-4 hidden sm:table-cell text-gray-500">
                        {file.type === 'FOLDER' ? '--' : formatBytes(file.size)}
                    </td>
                )}

                {/* Chủ sở hữu */}
                {showColumn(LIST_COLUMNS.OWNER) && (
                    <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                            {file.ownerAvatar ? (
                                <img
                                    src={file.ownerAvatar}
                                    alt={file.ownerName}
                                    className="w-7 h-7 rounded-full object-cover border border-gray-200"
                                />
                            ) : (
                                <FaUserCircle className="w-7 h-7 text-gray-300" />
                            )}
                            <span
                                className="text-gray-700 text-sm truncate max-w-[120px]"
                                title={file.ownerName || file.ownerEmail}
                            >
                                {file.ownerName || file.ownerEmail || 'Unknown'}
                            </span>
                        </div>
                    </td>
                )}

                {/* Ngày tạo */}
                {showColumn(LIST_COLUMNS.CREATED_AT) && (
                    <td className="px-6 py-4 hidden lg:table-cell text-gray-500">
                        {formatTime(file.createdAt)}
                    </td>
                )}

                {/* Ngày sửa đổi */}
                {showColumn(LIST_COLUMNS.UPDATED_AT) && (
                    <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                        {formatTime(file.updatedAt)}
                    </td>
                )}

                {/* Ngày chia sẻ */}
                {showColumn(LIST_COLUMNS.SHARED_AT) && (
                    <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                        {formatTime(file.sharedAt || file.updatedAt)}
                    </td>
                )}

                {/* Ngày xóa */}
                {showColumn(LIST_COLUMNS.DELETED_AT) && (
                    <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                        {formatTime(file.deletedAt || file.updatedAt)}
                    </td>
                )}

                {/* Thời điểm mở */}
                {showColumn(LIST_COLUMNS.ACCESSED_AT) && (
                    <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                        {formatTime(file.accessedAt, useRelativeTime)}
                    </td>
                )}

                {/* Trạng thái */}
                {showColumn(LIST_COLUMNS.STATUS) && (
                    <td className="px-6 py-4 hidden sm:table-cell">
                        {renderStatus(file)}
                    </td>
                )}

                {/* Actions */}
                {showColumn(LIST_COLUMNS.ACTIONS) && (
                    <td className="px-6 py-4 text-right">
                        <button
                            onClick={(e) => onMenuClick?.(e, file)}
                            className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Tùy chọn"
                        >
                            <FaEllipsisV />
                        </button>
                    </td>
                )}
            </tr>
        );
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in ${className}`}>
            <table className="w-full text-left border-collapse">
                {renderHeader()}
                <tbody className="text-gray-700 text-sm">
                    {files.map((file, index) => renderRow(file, index))}
                </tbody>
            </table>
        </div>
    );
};

export default FileListView;