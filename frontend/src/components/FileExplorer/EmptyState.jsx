import React from 'react';
import {
    FaFolder, FaSearch, FaShareAlt, FaClock, FaTrash,
    FaInbox, FaFileAlt
} from 'react-icons/fa';

/**
 * Cấu hình cho từng loại empty state
 */
const EMPTY_CONFIGS = {
    folder: {
        icon: <FaFolder className="text-gray-300" />,
        title: 'Thư mục trống',
        subtitle: 'Nhấn chuột phải để tạo mới hoặc tải lên.'
    },
    search: {
        icon: <FaSearch className="text-gray-300" />,
        title: 'Không tìm thấy kết quả',
        subtitle: 'Thử tìm kiếm với từ khóa khác.'
    },
    shared: {
        icon: <FaShareAlt className="text-gray-300" />,
        title: 'Chưa có tài liệu được chia sẻ',
        subtitle: 'Các tập tin và thư mục được chia sẻ với bạn sẽ xuất hiện ở đây.'
    },
    recent: {
        icon: <FaClock className="text-gray-300" />,
        title: 'Chưa có hoạt động gần đây',
        subtitle: 'Các tài liệu bạn mở gần đây sẽ xuất hiện ở đây.'
    },
    trash: {
        icon: <FaTrash className="text-gray-300" />,
        title: 'Thùng rác trống',
        subtitle: 'Các mục đã xóa sẽ xuất hiện ở đây.'
    },
    inbox: {
        icon: <FaInbox className="text-gray-300" />,
        title: 'Không có yêu cầu nào',
        subtitle: 'Các yêu cầu truy cập sẽ xuất hiện ở đây.'
    },
    default: {
        icon: <FaFileAlt className="text-gray-300" />,
        title: 'Không có dữ liệu',
        subtitle: 'Không có gì để hiển thị.'
    }
};

/**
 * Component hiển thị trạng thái trống
 * 
 * @param {string} type - Loại empty state:  'folder' | 'search' | 'shared' | 'recent' | 'trash' | 'inbox'
 * @param {string} title - Override title
 * @param {string} subtitle - Override subtitle
 * @param {ReactNode} icon - Override icon
 * @param {ReactNode} action - Nút hành động (optional)
 * @param {string} className - Class bổ sung
 */
const EmptyState = ({
    type = 'default',
    title,
    subtitle,
    icon,
    action,
    className = ''
}) => {
    const config = EMPTY_CONFIGS[type] || EMPTY_CONFIGS.default;

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center animate-fade-in ${className}`}>
            <div className="text-5xl mb-4 flex justify-center">
                {icon || config.icon}
            </div>
            <p className="text-gray-600 font-medium mb-1">
                {title || config.title}
            </p>
            <p className="text-sm text-gray-400">
                {subtitle || config.subtitle}
            </p>
            {action && (
                <div className="mt-4">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;