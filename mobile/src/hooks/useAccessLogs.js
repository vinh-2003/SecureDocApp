import { useState, useCallback, useEffect, useRef } from 'react';
import adminService from '../services/adminService';

const useAccessLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Pagination state
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 15;

    // Filters
    const [keyword, setKeyword] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');

    // Dùng Ref để tránh closure stale state khi gọi debounce/timeout
    const searchTimeout = useRef(null);

    const fetchLogs = async (pageNum, isRefresh = false, searchKey = keyword, action = actionFilter) => {
        try {
            if (isRefresh) setRefreshing(true);
            else if (pageNum > 0) setLoadingMore(true);
            else setLoading(true);

            const res = await adminService.getAccessLogs(pageNum, pageSize, searchKey, action);
            
            if (res.success) {
                const newLogs = res.data.content || [];
                const totalPages = res.data.totalPages;

                if (isRefresh || pageNum === 0) {
                    setLogs(newLogs);
                } else {
                    setLogs(prev => [...prev, ...newLogs]);
                }

                setHasMore(pageNum < totalPages - 1);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Lỗi tải logs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    // Hàm gọi khi người dùng vuốt xuống để refresh
    const onRefresh = useCallback(() => {
        fetchLogs(0, true, keyword, actionFilter);
    }, [keyword, actionFilter]);

    // Hàm gọi khi lướt xuống đáy (Load More)
    const onLoadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            fetchLogs(page + 1, false, keyword, actionFilter);
        }
    }, [loadingMore, hasMore, loading, page, keyword, actionFilter]);

    // Hàm xử lý tìm kiếm (Debounce thủ công)
    const handleSearch = (text) => {
        setKeyword(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        
        searchTimeout.current = setTimeout(() => {
            fetchLogs(0, false, text, actionFilter);
        }, 500);
    };

    // Hàm thay đổi filter hành động
    const handleActionChange = (newAction) => {
        if (newAction !== actionFilter) {
            setActionFilter(newAction);
            fetchLogs(0, false, keyword, newAction);
        }
    };

    // Init load
    useEffect(() => {
        fetchLogs(0);
    }, []);

    return {
        logs,
        loading,
        refreshing,
        loadingMore,
        keyword,
        actionFilter,
        setKeyword: handleSearch,
        setActionFilter: handleActionChange,
        onRefresh,
        onLoadMore
    };
};

export default useAccessLogs;