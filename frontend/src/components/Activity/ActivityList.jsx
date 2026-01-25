import React, { useRef, useCallback } from 'react';
import { FaHistory, FaSpinner } from 'react-icons/fa';
import ActivityItem from './ActivityItem';

/**
 * Component hiển thị danh sách activity với infinite scroll
 */
const ActivityList = ({
    activities,
    loading,
    error,
    hasMore,
    onLoadMore,
    currentUserId,
    showTarget = true,
    emptyMessage = 'Chưa có hoạt động nào'
}) => {
    const observerRef = useRef();

    // Infinite scroll observer
    const lastItemRef = useCallback(node => {
        if (loading) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                onLoadMore?.();
            }
        });

        if (node) observerRef.current.observe(node);
    }, [loading, hasMore, onLoadMore]);

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-gray-600">{error}</p>
            </div>
        );
    }

    // Empty state
    if (!loading && activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FaHistory className="text-gray-400 text-2xl" />
                </div>
                <p className="text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100">
            {activities.map((activity, index) => {
                const isLast = index === activities.length - 1;
                return (
                    <div
                        key={activity.id}
                        ref={isLast ? lastItemRef : null}
                    >
                        <ActivityItem
                            activity={activity}
                            currentUserId={currentUserId}
                            showTarget={showTarget}
                        />
                    </div>
                );
            })}

            {/* Loading more indicator */}
            {loading && activities.length > 0 && (
                <div className="flex justify-center py-4">
                    <FaSpinner className="animate-spin text-blue-600" size={20} />
                </div>
            )}

            {/* Initial loading */}
            {loading && activities.length === 0 && (
                <div className="flex justify-center py-12">
                    <FaSpinner className="animate-spin text-blue-600" size={24} />
                </div>
            )}
        </div>
    );
};

export default ActivityList;