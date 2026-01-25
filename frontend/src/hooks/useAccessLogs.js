import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';
import adminService from '../services/adminService';

export const useAccessLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 20, // Log thường nhiều dòng nên để size lớn hơn user
        totalPages: 0,
        totalElements: 0
    });

    // States cho bộ lọc
    const [keyword, setKeyword] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');

    const fetchLogs = useCallback(async (p = 0, k = keyword, act = actionFilter) => {
        try {
            setLoading(true);
            const res = await adminService.getAccessLogs(p, pagination.size, k, act);
            if (res.success) {
                const { content, totalPages, totalElements, number } = res.data;
                setLogs(content);
                setPagination(prev => ({
                    ...prev,
                    totalPages,
                    totalElements,
                    page: number
                }));
            }
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải nhật ký truy cập');
        } finally {
            setLoading(false);
        }
    }, [pagination.size, keyword, actionFilter]);

    const debouncedSearch = useMemo(
        () =>
            debounce((value) => {
                setKeyword(value);
                // Gọi fetch luôn tại đây với value mới nhất
                fetchLogs(0, value, actionFilter);
            }, 500),
        [fetchLogs, actionFilter] // Re-create debounce nếu fetchLogs hoặc action thay đổi
    );

    const handleSearch = useCallback((value) => {
        debouncedSearch(value);
    }, [debouncedSearch]);

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    // Handle Action Filter Change
    const handleActionChange = (newAction) => {
        setActionFilter(newAction);
        fetchLogs(0, keyword, newAction);
    };

    // Initial load
    useEffect(() => {
        fetchLogs(0, '', 'ALL');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        logs,
        loading,
        pagination,
        keyword,
        actionFilter,
        setKeyword: handleSearch,
        setActionFilter: handleActionChange,
        fetchLogs
    };
};