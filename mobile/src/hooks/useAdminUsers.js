import { useState, useCallback, useEffect, useRef } from 'react';
import adminService from '../services/adminService';

const useAdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Pagination state
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 10;
    
    // Search state
    const [keyword, setKeyword] = useState('');
    
    const searchTimeout = useRef(null);

    const fetchUsers = async (pageNum, isRefresh = false, searchKey = keyword) => {
        try {
            if (isRefresh) setRefreshing(true);
            else if (pageNum > 0) setLoadingMore(true);
            else setLoading(true);

            const res = await adminService.getUsers(pageNum, pageSize, searchKey);
            
            if (res.success) {
                const newUsers = res.data.content || [];
                const totalPages = res.data.totalPages;

                if (isRefresh || pageNum === 0) {
                    setUsers(newUsers);
                } else {
                    setUsers(prev => [...prev, ...newUsers]);
                }

                setHasMore(pageNum < totalPages - 1);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Lỗi tải users:', error);
            // Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    const onRefresh = useCallback(() => {
        fetchUsers(0, true, keyword);
    }, [keyword]);

    const onLoadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            fetchUsers(page + 1, false, keyword);
        }
    }, [loadingMore, hasMore, loading, page, keyword]);

    // Handle Search
    const handleSearch = (text) => {
        setKeyword(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            fetchUsers(0, false, text);
        }, 500);
    };

    // Helper refresh nhanh sau khi update data
    const refreshData = () => fetchUsers(0, true, keyword);

    useEffect(() => {
        fetchUsers(0);
    }, []);

    return {
        users,
        loading,
        refreshing,
        loadingMore,
        keyword,
        setKeyword: handleSearch,
        onRefresh,
        onLoadMore,
        refreshData
    };
};

export default useAdminUsers;