import { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';

/**
 * Hook quản lý tìm kiếm user theo email
 */
const useUserSearch = (options = {}) => {
    const {
        initialUserId = '',
        onUserChange,
        debounceMs = 600
    } = options;

    const [searchEmail, setSearchEmail] = useState('');
    const [foundUser, setFoundUser] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState('');

    // Restore user từ ID khi mount
    useEffect(() => {
        if (!initialUserId || foundUser || searchEmail) return;

        const restoreUser = async () => {
            setIsRestoring(true);
            try {
                const res = await userService.getUserById(initialUserId);
                if (res.success) {
                    setFoundUser(res.data);
                    setSearchEmail(res.data.email);
                    onUserChange?.(res.data.id);
                }
            } catch (err) {
                console.error('Lỗi khôi phục user:', err);
                setSearchEmail(initialUserId);
            } finally {
                setIsRestoring(false);
            }
        };

        restoreUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialUserId]);

    // Search user khi email thay đổi
    useEffect(() => {
        if (isRestoring) return;

        if (!searchEmail.trim()) {
            setFoundUser(null);
            setError('');
            onUserChange?.('');
            return;
        }

        // Không search lại nếu email trùng với user đã tìm thấy
        if (foundUser && searchEmail === foundUser.email) return;

        const timer = setTimeout(async () => {
            setIsSearching(true);
            setError('');

            try {
                const res = await userService.findUserByEmail(searchEmail);
                if (res.success) {
                    setFoundUser(res.data);
                    onUserChange?.(res.data.id);
                }
            } catch (err) {
                setFoundUser(null);
                onUserChange?.('');
                setError('Không tìm thấy user');
            } finally {
                setIsSearching(false);
            }
        }, debounceMs);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchEmail, debounceMs]);

    // Clear user
    const clearUser = useCallback(() => {
        setFoundUser(null);
        setSearchEmail('');
        setError('');
        onUserChange?.('');
    }, [onUserChange]);

    // Reset all - ĐẢM BẢO RESET HOÀN TOÀN
    const reset = useCallback(() => {
        setSearchEmail('');
        setFoundUser(null);
        setError('');
        setIsSearching(false);
        setIsRestoring(false);
        onUserChange?.('');
    }, [onUserChange]);

    return {
        searchEmail,
        setSearchEmail,
        foundUser,
        isSearching,
        isRestoring,
        error,
        clearUser,
        reset,
        isLoading: isSearching || isRestoring
    };
};

export default useUserSearch;