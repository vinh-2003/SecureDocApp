import React, { useState, useContext, useCallback, useEffect } from 'react';
import { FaHistory, FaUser, FaClock } from 'react-icons/fa';
import { useActivityLog } from '../../hooks';
import { AuthContext } from '../../context/AuthContext';
import { ActivityList, ActivityFilter } from '../../components/Activity';
import { PageHeader } from '../../components/Common';

// Simple Pagination component (bạn có thể tách riêng ra file Pagination.jsx nếu muốn)
const Pagination = ({ page, totalPages, onPageChange, disabled }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-center items-center gap-2 mt-4 select-none">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0 || disabled}
                className={`px-3 py-1 rounded ${page === 0 ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
            >Trước</button>
            <span className="text-sm text-gray-700 font-semibold">
                Trang {page + 1} / {totalPages}
            </span>
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages - 1 || disabled}
                className={`px-3 py-1 rounded ${page === totalPages - 1 ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
            >Tiếp</button>
        </div>
    );
};

const ActivityPage = () => {
    const { user } = useContext(AuthContext);
    const [viewMode, setViewMode] = useState('recent'); // 'recent' | 'my'
    const [currentPage, setCurrentPage] = useState(0);  // chỉ dùng cho mode "my"

    const {
        activities,
        loading,
        error,
        pagination,
        filters,
        fetchActivities,
        updateFilters,
        clearFilters,
        setActivities,
        setPagination
    } = useActivityLog(null, {
        autoLoad: true,
        pageSize: 30,
        mode: viewMode === 'my' ? 'my' : 'recent'
    });

    // Reset phân trang khi đổi viewMode, hoặc đổi filter
    useEffect(() => {
        setActivities && setActivities([]);
        setPagination && setPagination({
            currentPage: 0,
            totalPages: 0,
            totalElements: 0,
            hasNext: false,
            hasPrevious: false
        });
        setCurrentPage(0);
        fetchActivities(0, false); // load lại trang đầu
        // eslint-disable-next-line
    }, [viewMode]);

    // Khi filter thay đổi
    const handleFilterChange = useCallback((newFilters) => {
        updateFilters(newFilters);
        setCurrentPage(0);
        fetchActivities(0, false);
    }, [updateFilters, fetchActivities]);

    // Khi clear filter
    const handleClearFilters = useCallback(() => {
        clearFilters();
        setCurrentPage(0);
        fetchActivities(0, false);
    }, [clearFilters, fetchActivities]);

    // Khi đổi trang trong mode "my"
    const handlePageChange = (page) => {
        if (page !== pagination.currentPage && !loading && page >= 0 && page < pagination.totalPages) {
            setCurrentPage(page);
            fetchActivities(page, false); // load page, không append
        }
    };

    // Khi Nhấn làm mới
    const handleRefresh = useCallback(() => {
        fetchActivities(currentPage, false);
    }, [fetchActivities, currentPage]);

    // Số lượng hiển thị
    const displayed = Math.min(activities.length, pagination.totalElements || activities.length);
    const total = pagination.totalElements || activities.length;

    // Infinite scroll chỉ dùng cho "recent", "my" dùng phân trang "tĩnh"
    const showPagination = viewMode === 'my' && pagination.totalPages > 1;

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="Lịch sử hoạt động"
                subtitle="Xem lại tất cả các thay đổi và hoạt động trên tài liệu của bạn"
                icon={<FaHistory className="text-blue-600 text-2xl" />}
            />

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Toolbar */}
                <div className="bg-white rounded-xl shadow-sm border mb-6 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('recent')}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition
                                    ${viewMode === 'recent'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                    }
                                `}
                            >
                                <FaClock size={14} />
                                Gần đây
                            </button>
                            <button
                                onClick={() => setViewMode('my')}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition
                                    ${viewMode === 'my'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                    }
                                `}
                            >
                                <FaUser size={14} />
                                Hoạt động của tôi
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2">
                            <ActivityFilter
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                onClear={handleClearFilters}
                            />
                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                            >
                                Làm mới
                            </button>
                        </div>
                    </div>
                </div>

                {/* Activity List */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <ActivityList
                    activities={viewMode === 'recent' ? activities.slice(0, 30) : activities}
                    loading={loading}
                    error={error}
                    hasMore={false}
                    onLoadMore={undefined}
                    currentUserId={user?.id}
                    showTarget={true}
                    emptyMessage={
                        viewMode === 'my'
                            ? 'Bạn chưa thực hiện hoạt động nào'
                            : 'Chưa có hoạt động nào được ghi nhận'
                    }
                />
                </div>

                {/* Pagination cho "my" */}
                {showPagination && (
                    <Pagination
                        page={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                        disabled={loading}
                    />
                )}

                {/* Stats */}
                {(total > 0) && (
                    <div className="text-center text-sm text-gray-500 mt-4">
                        Hiển thị {displayed} / {total} hoạt động
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityPage;