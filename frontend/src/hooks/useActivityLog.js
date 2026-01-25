import { useState, useCallback, useEffect } from 'react';
import activityService from '../services/activityService';
import { toast } from 'react-toastify';

/**
 * Hook quản lý Activity Log
 * @param {string} nodeId - ID của file/folder (optional)
 * @param {Object} options - Các options
 */
const useActivityLog = (nodeId = null, options = {}) => {
    const {
        autoLoad = true,
        pageSize = 20,
        mode = 'node' // 'node' | 'my' | 'recent'
    } = options;

    // State
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        hasNext: false,
        hasPrevious: false
    });

    // Filters
    const [filters, setFilters] = useState({
        actionTypes: [],
        actorId: null,
        fromDate: null,
        toDate: null
    });

    /**
     * Fetch activities
     */
    const fetchActivities = useCallback(async (page = 0, append = false) => {
        setLoading(true);
        setError(null);

        try {
            let response;

            switch (mode) {
                case 'my':
                    response = await activityService.getMyActivities(page, pageSize);
                    break;
                case 'recent':
                    response = await activityService.getRecentActivities(30);
                    setActivities(response || []);
                    setPagination({
                        currentPage: 0,
                        totalPages: 1,
                        totalElements: Array.isArray(response) ? response.length : 0,
                        hasNext: false,
                        hasPrevious: false
                    });
                    setLoading(false);
                    return;
                case 'node':
                default:
                    if (!nodeId) {
                        setLoading(false);
                        return;
                    }
                    response = await activityService.getNodeActivities(nodeId, {
                        page,
                        size: pageSize,
                        ...filters
                    });
                    break;
            }

            const { activities: newActivities, ...paginationData } = response;

            if (append) {
                setActivities(prev => [...prev, ...newActivities]);
            } else {
                setActivities(newActivities || []);
            }

            setPagination({
                currentPage: paginationData.currentPage,
                totalPages: paginationData.totalPages,
                totalElements: paginationData.totalElements,
                hasNext: paginationData.hasNext,
                hasPrevious: paginationData.hasPrevious
            });

        } catch (err) {
            console.error('Failed to fetch activities:', err);
            setError(err.message || 'Không thể tải lịch sử hoạt động');
            toast.error('Không thể tải lịch sử hoạt động');
        } finally {
            setLoading(false);
        }
    }, [nodeId, mode, pageSize, filters]);

    /**
     * Load more (infinite scroll)
     */
    const loadMore = useCallback(() => {
        if (pagination.hasNext && !loading) {
            fetchActivities(pagination.currentPage + 1, true);
        }
    }, [pagination.hasNext, pagination.currentPage, loading, fetchActivities]);

    /**
     * Refresh
     */
    const refresh = useCallback(() => {
        fetchActivities(0, false);
    }, [fetchActivities]);

    /**
     * Update filters
     */
    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    /**
     * Clear filters
     */
    const clearFilters = useCallback(() => {
        setFilters({
            actionTypes: [],
            actorId: null,
            fromDate: null,
            toDate: null
        });
    }, []);

    // Auto load on mount or when nodeId/filters change
    useEffect(() => {
        if (autoLoad) {
            fetchActivities(0, false);
        }
    }, [autoLoad, nodeId, filters, fetchActivities]);

    return {
        activities,
        loading,
        error,
        pagination,
        filters,
        fetchActivities,
        loadMore,
        refresh,
        updateFilters,
        clearFilters
    };
};

export default useActivityLog;