import React from 'react';
import { 
    FaSignInAlt, FaSignOutAlt, FaSyncAlt, FaGoogle, FaDesktop, FaGlobe 
} from 'react-icons/fa';
import { formatDate } from '../../utils/format';
import LogStatusBadge from './LogStatusBadge';

// Helper: Chọn icon dựa trên Action
const getActionIcon = (action) => {
    switch (action) {
        case 'LOGIN': return <FaSignInAlt className="text-blue-500" />;
        case 'LOGOUT': return <FaSignOutAlt className="text-gray-500" />;
        case 'REFRESH_TOKEN': return <FaSyncAlt className="text-orange-500" />;
        case 'GOOGLE_LOGIN': return <FaGoogle className="text-red-500" />;
        default: return <FaGlobe className="text-gray-400" />;
    }
};

const LogsTable = ({ logs, pagination, onPageChange }) => {
    if (!logs || logs.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                Không có dữ liệu nhật ký nào.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-3 border-b">Hành động</th>
                            <th className="px-6 py-3 border-b">Người dùng</th>
                            <th className="px-6 py-3 border-b">IP & Thiết bị</th>
                            <th className="px-6 py-3 border-b text-center">Trạng thái</th>
                            <th className="px-6 py-3 border-b text-right">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                {/* Action */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-full">
                                            {getActionIcon(log.action)}
                                        </div>
                                        <span className="font-medium text-gray-700">
                                            {log.action?.replace('_', ' ')}
                                        </span>
                                    </div>
                                </td>

                                {/* User */}
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">
                                        {log.username || 'Unknown'}
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono" title={log.id}>
                                        ID: {log.id.substring(0, 8)}...
                                    </div>
                                </td>

                                {/* IP & Device */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-gray-600 text-xs bg-gray-100 w-fit px-1 rounded mb-1">
                                            {log.ipAddress}
                                        </span>
                                        <div className="flex items-center gap-1 text-gray-500 text-xs max-w-[200px] truncate" title={log.userAgent}>
                                            <FaDesktop size={10} className="shrink-0" />
                                            <span className="truncate">{log.userAgent}</span>
                                        </div>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="px-6 py-4 text-center">
                                    <LogStatusBadge isSuccess={log.success} errorMessage={log.errorMessage} />
                                    {log.errorMessage && (
                                        <div className="text-xs text-red-500 mt-1 max-w-[150px] truncate mx-auto" title={log.errorMessage}>
                                            {log.errorMessage}
                                        </div>
                                    )}
                                </td>

                                {/* Time */}
                                <td className="px-6 py-4 text-right text-gray-500">
                                    {formatDate(log.timestamp)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Tái sử dụng logic từ UsersTable) */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                    <span className="text-sm text-gray-600">
                        Trang {pagination.page + 1} / {pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 0}
                            className="px-3 py-1 rounded border bg-white disabled:opacity-50 text-sm hover:bg-gray-50"
                        >
                            Trước
                        </button>
                        <button
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages - 1}
                            className="px-3 py-1 rounded border bg-white disabled:opacity-50 text-sm hover:bg-gray-50"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogsTable;