import React from 'react';
import { FaArrowRight, FaUserPlus, FaUserMinus } from 'react-icons/fa';

/**
 * Component hiển thị chi tiết bổ sung cho activity
 */
const ActivityDetails = ({ actionType, details }) => {
    if (!details) return null;

    const renderDetails = () => {
        switch (actionType) {
            case 'RENAMED':
                return (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="line-through">{details.oldName}</span>
                        <FaArrowRight size={10} />
                        <span className="font-medium text-gray-700">{details.newName}</span>
                    </div>
                );

            case 'MOVED':
                return (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="truncate max-w-[150px]" title={details.fromPath}>
                            {details.fromPath || 'Thư mục gốc'}
                        </span>
                        <FaArrowRight size={10} />
                        <span className="truncate max-w-[150px] font-medium text-gray-700" title={details.toPath}>
                            {details.toPath || 'Thư mục gốc'}
                        </span>
                    </div>
                );

            case 'SHARED':
                return (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <FaUserPlus className="text-green-500" size={12} />
                        <span>
                            Chia sẻ với <span className="font-medium text-gray-700">{details.targetUserEmail}</span>
                            {details.role && (
                                <span className="text-gray-400"> ({details.role === 'EDITOR' ? 'Chỉnh sửa' : 'Xem'})</span>
                            )}
                        </span>
                    </div>
                );

            case 'REVOKED':
                return (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <FaUserMinus className="text-red-500" size={12} />
                        <span>
                            Thu hồi quyền của <span className="font-medium text-gray-700">{details.targetUserEmail}</span>
                        </span>
                    </div>
                );

            case 'PUBLIC_ACCESS_CHANGED':
                const accessLabels = {
                    'PRIVATE': 'Riêng tư',
                    'PUBLIC_VIEW': 'Công khai (Xem)',
                    'PUBLIC_EDIT': 'Công khai (Chỉnh sửa)'
                };
                return (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{accessLabels[details.oldAccess] || details.oldAccess}</span>
                        <FaArrowRight size={10} />
                        <span className="font-medium text-gray-700">
                            {accessLabels[details.newAccess] || details.newAccess}
                        </span>
                    </div>
                );

            case 'COPIED':
                return (
                    <div className="text-xs text-gray-500 mt-1">
                        Sao chép từ:  <span className="font-medium text-gray-700">{details.originalNodeName}</span>
                    </div>
                );

            case 'FILE_UPLOADED':
                if (details.size) {
                    const formatSize = (bytes) => {
                        if (bytes < 1024) return bytes + ' B';
                        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
                    };
                    return (
                        <div className="text-xs text-gray-500 mt-1">
                            Kích thước: {formatSize(details.size)}
                        </div>
                    );
                }
                return null;

            default:
                return null;
        }
    };

    return renderDetails();
};

export default ActivityDetails;