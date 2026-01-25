import React, { useContext } from 'react';
import { FaTimes, FaHistory, FaSync } from 'react-icons/fa';
import { useActivityLog } from '../../hooks';
import { AuthContext } from '../../context/AuthContext';
import ActivityList from './ActivityList';
import ActivityFilter from './ActivityFilter';

/**
 * Modal hiển thị lịch sử hoạt động của file/folder
 */
const ActivityLogModal = ({
    isOpen,
    onClose,
    nodeId,
    nodeName = 'Tài liệu'
}) => {
    const { user } = useContext(AuthContext);

    const {
        activities,
        loading,
        error,
        pagination,
        filters,
        loadMore,
        refresh,
        updateFilters,
        clearFilters
    } = useActivityLog(nodeId, {
        autoLoad: isOpen,
        pageSize: 20,
        mode: 'node'
    });

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[85vh] overflow-hidden flex flex-col animate-fade-in-down">
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FaHistory className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Lịch sử hoạt động</h3>
                            <p className="text-sm text-gray-500 truncate max-w-[300px]" title={nodeName}>
                                {nodeName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-200 rounded-lg"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 border-b flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                        <ActivityFilter
                            filters={filters}
                            onFilterChange={updateFilters}
                            onClear={clearFilters}
                        />
                        <button
                            onClick={refresh}
                            disabled={loading}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            title="Làm mới"
                        >
                            <FaSync size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <span className="text-xs text-gray-400">
                        {pagination.totalElements} hoạt động
                    </span>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <ActivityList
                        activities={activities}
                        loading={loading}
                        error={error}
                        hasMore={pagination.hasNext}
                        onLoadMore={loadMore}
                        currentUserId={user?.id}
                        showTarget={false}
                        emptyMessage="Chưa có hoạt động nào được ghi nhận"
                    />
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition text-sm font-medium"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogModal;