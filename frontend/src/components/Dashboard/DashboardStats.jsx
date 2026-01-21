import React from 'react';
import { FaHdd, FaLayerGroup, FaFolder, FaShareAlt, FaClock, FaTrash } from 'react-icons/fa';
import { formatBytes } from '../../utils/format';

/**
 * Các loại stat card có thể hiển thị
 */
export const STAT_TYPES = {
    STORAGE: 'storage',
    TOTAL_FILES: 'totalFiles',
    TOTAL_FOLDERS: 'totalFolders',
    SHARED_FILES: 'sharedFiles',
    RECENT_FILES: 'recentFiles',
    TRASH_FILES: 'trashFiles'
};

/**
 * Component hiển thị thống kê Dashboard
 * 
 * @param {string} title - Tiêu đề section
 * @param {Array} stats - Mảng các stat để hiển thị [{ type, value, label }]
 * @param {string} className - Class bổ sung
 */
const DashboardStats = ({
    title = 'Tài liệu của tôi',
    stats = [],
    className = ''
}) => {
    // Config cho các loại stat
    const statConfig = {
        [STAT_TYPES.STORAGE]: {
            icon: <FaHdd size={24} />,
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600',
            defaultLabel: 'Đã sử dụng',
            formatValue: (value) => formatBytes(value)
        },
        [STAT_TYPES.TOTAL_FILES]: {
            icon: <FaLayerGroup size={24} />,
            bgColor: 'bg-green-100',
            textColor: 'text-green-600',
            defaultLabel: 'Tổng số file',
            formatValue: (value) => `${value} Files`
        },
        [STAT_TYPES.TOTAL_FOLDERS]: {
            icon: <FaFolder size={24} />,
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-600',
            defaultLabel: 'Tổng số thư mục',
            formatValue: (value) => `${value} Thư mục`
        },
        [STAT_TYPES.SHARED_FILES]: {
            icon: <FaShareAlt size={24} />,
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-600',
            defaultLabel: 'Được chia sẻ',
            formatValue: (value) => `${value} Files`
        },
        [STAT_TYPES.RECENT_FILES]: {
            icon: <FaClock size={24} />,
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-600',
            defaultLabel: 'Gần đây',
            formatValue: (value) => `${value} Files`
        },
        [STAT_TYPES.TRASH_FILES]: {
            icon: <FaTrash size={24} />,
            bgColor: 'bg-red-100',
            textColor: 'text-red-600',
            defaultLabel: 'Trong thùng rác',
            formatValue: (value) => `${value} Files`
        }
    };

    // Render một stat card
    const renderStatCard = (stat, index) => {
        const config = statConfig[stat.type] || statConfig[STAT_TYPES.TOTAL_FILES];

        return (
            <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4"
            >
                <div className={`p-3 ${config.bgColor} ${config.textColor} rounded-full`}>
                    {stat.icon || config.icon}
                </div>
                <div>
                    <p className="text-gray-500 text-sm">{stat.label || config.defaultLabel}</p>
                    <p className="text-2xl font-bold text-gray-800">
                        {stat.formattedValue || config.formatValue(stat.value)}
                    </p>
                </div>
            </div>
        );
    };

    if (stats.length === 0) return null;

    return (
        <div className={className}>
            {title && (
                <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>
            )}
            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(stats.length, 3)} gap-6 mb-8`}>
                {stats.map((stat, index) => renderStatCard(stat, index))}
            </div>
        </div>
    );
};

export default DashboardStats;