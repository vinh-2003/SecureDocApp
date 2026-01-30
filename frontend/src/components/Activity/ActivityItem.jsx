import React from 'react';
import { FaUserCircle, FaFolder, FaFile, FaExternalLinkAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // [THÊM]
import fileService from '../../services/fileService';

import ActivityIcon from './ActivityIcon';
import ActivityBadge from './ActivityBadge';
import ActivityDetails from './ActivityDetails';

/**
 * Component hiển thị một activity item
 */
const ActivityItem = ({ activity, currentUserId, showTarget = true }) => {
    const navigate = useNavigate();

    const {
        actionType,
        actionDisplayText,
        targetNodeId,
        targetNodeName,
        targetNodeType,
        targetNodeExists,
        actor,
        details,
        relativeTime,
        createdAt
    } = activity;

    const isCurrentUser = actor?.id === currentUserId;

    // Click vào target node
    const handleTargetClick = async () => {
        if (!targetNodeExists || !targetNodeId) return;

        // 1. Folder -> Navigate
        if (targetNodeType === 'FOLDER') {
            navigate(`/folders/${targetNodeId}`);
            return;
        }

        const name = targetNodeName?.toLowerCase() || '';

        // 2. File xem trong ứng dụng (PDF, Word)
        const isInternalViewable =
            name.endsWith('.pdf') ||
            name.endsWith('.docx') ||
            name.endsWith('.doc');

        if (isInternalViewable) {
            navigate(`/file/view/${targetNodeId}`);
            return;
        }

        // 3. File xem nhanh trên trình duyệt (Ảnh, Video, Text)
        // Kiểm tra đuôi file vì activity có thể không có mimeType
        const isBrowserPreviewable = /\.(jpg|jpeg|png|gif|webp|mp4|webm|txt)$/i.test(name);

        if (isBrowserPreviewable) {
            const toastId = toast.loading(`Đang mở: ${targetNodeName}...`);
            try {
                // Gọi API lấy blob inline
                const response = await fileService.previewFile(targetNodeId);

                // Mime type lấy từ response header hoặc đoán từ đuôi file
                const fileType = response.type || 'application/octet-stream';
                const blob = new Blob([response], { type: fileType });
                const url = window.URL.createObjectURL(blob);

                window.open(url, '_blank');

                setTimeout(() => window.URL.revokeObjectURL(url), 60000);
                toast.dismiss(toastId);
            } catch (error) {
                toast.dismiss(toastId);
                toast.error("Không thể xem trước file này.");
            }
            return;
        }

        // 4. Các file còn lại -> Tải xuống
        try {
            const toastId = toast.loading("Đang bắt đầu tải xuống...");
            const response = await fileService.downloadFile(targetNodeId);

            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', targetNodeName);
            document.body.appendChild(link);
            link.click();

            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.dismiss(toastId);
        } catch (error) {
            toast.dismiss();
            toast.error("Lỗi khi tải file.");
        }
    };

    return (
        <div className="flex gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
                <ActivityIcon actionType={actionType} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Main text */}
                <div className="flex flex-wrap items-center gap-1 text-sm">
                    {/* Actor */}
                    <div className="flex items-center gap-1.5">
                        {actor?.avatarUrl ? (
                            <img
                                src={actor.avatarUrl}
                                alt={actor.name}
                                className="w-5 h-5 rounded-full object-cover"
                            />
                        ) : (
                            <FaUserCircle className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-900">
                            {isCurrentUser ? 'Bạn' : (actor?.name || actor?.email || 'Người dùng')}
                        </span>
                    </div>

                    {/* Action */}
                    <span className="text-gray-600">{actionDisplayText}</span>

                    {/* Target */}
                    {showTarget && (
                        <button
                            onClick={handleTargetClick}
                            disabled={!targetNodeExists}
                            className={`
                                inline-flex items-center gap-1 max-w-[200px]
                                ${targetNodeExists
                                    ? 'text-blue-600 hover:text-blue-700 hover:underline cursor-pointer'
                                    : 'text-gray-500 cursor-not-allowed'
                                }
                            `}
                            title={targetNodeName}
                        >
                            {targetNodeType === 'FOLDER' ? (
                                <FaFolder className="flex-shrink-0 text-yellow-500" size={12} />
                            ) : (
                                <FaFile className="flex-shrink-0 text-gray-400" size={12} />
                            )}
                            <span className="truncate font-medium">{targetNodeName}</span>
                            {targetNodeExists && (
                                <FaExternalLinkAlt className="flex-shrink-0" size={10} />
                            )}
                        </button>
                    )}
                </div>

                {/* Details (if any) */}
                <ActivityDetails actionType={actionType} details={details} />

                {/* Time */}
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400" title={createdAt}>
                        {relativeTime}
                    </span>
                    <ActivityBadge actionType={actionType} />
                </div>
            </div>
        </div>
    );
};

export default ActivityItem;