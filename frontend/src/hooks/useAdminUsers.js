import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';
import adminService from '../services/adminService';

export const useAdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalPages: 0,
        totalElements: 0
    });
    const [keyword, setKeyword] = useState('');

    const fetchUsers = useCallback(async (p = 0, k = keyword) => {
        try {
            setLoading(true);
            const res = await adminService.getUsers(p, pagination.size, k);
            if (res.success) {
                const { content, totalPages, totalElements, number } = res.data;
                setUsers(content);
                setPagination(prev => ({ 
                    ...prev, 
                    totalPages, 
                    totalElements, 
                    page: number 
                }));
            }
        } catch (error) {
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, [pagination.size, keyword]);

    // Debounce search function
    // 1. Dùng useMemo để tạo instance debounce
    const debouncedSearch = useMemo(
        () =>
            debounce((value) => {
                setKeyword(value);
                // Gọi API ngay khi debounce xong
                fetchUsers(0, value);
            }, 500),
        [fetchUsers]
    );

    // 2. Wrapper function để dùng trong Component
    const handleSearch = useCallback((value) => {
        debouncedSearch(value);
    }, [debouncedSearch]);

    // 3. Cleanup khi unmount
    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    // Trigger fetch when keyword or page changes logic is handled in component via useEffect or direct call
    // Here we expose a direct refresh method
    const refreshData = () => fetchUsers(pagination.page, keyword);

    return {
        users,
        loading,
        pagination,
        keyword,
        setKeyword: handleSearch,
        fetchUsers,
        refreshData
    };
};