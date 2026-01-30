import { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';

/**
 * Hook quản lý tìm kiếm user theo email
 * @param {Object} options 
 * @param {string} options.initialUserId - ID user ban đầu (nếu đang edit/filter)
 * @param {Function} options.onUserChange - Callback khi tìm thấy user (trả về ID)
 * @param {number} options.debounceMs - Thời gian chờ (default: 600ms)
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
    const [isRestoring, setIsRestoring] = useState(false); // Trạng thái đang load user cũ
    const [error, setError] = useState('');

    // 1. Restore user từ ID khi mount (Dùng cho trường hợp mở lại modal đã có filter cũ)
    useEffect(() => {
        // Nếu không có ID ban đầu, hoặc đã có data, hoặc đang gõ email thì bỏ qua
        if (!initialUserId || foundUser || searchEmail) return;

        let isMounted = true;

        const restoreUser = async () => {
            setIsRestoring(true);
            try {
                // Gọi API lấy thông tin user theo ID
                const res = await userService.getUserById(initialUserId);
                if (isMounted && res.success) {
                    setFoundUser(res.data);
                    setSearchEmail(res.data.email);
                    // Không cần gọi onUserChange ở đây vì ID đã được truyền vào từ ngoài
                }
            } catch (err) {
                console.error('Lỗi khôi phục user:', err);
                // Nếu lỗi, vẫn hiển thị ID cũ vào ô input để user biết
                if (isMounted) setSearchEmail(initialUserId); 
            } finally {
                if (isMounted) setIsRestoring(false);
            }
        };

        restoreUser();
        
        return () => { isMounted = false; };
    }, [initialUserId]); 
    // Lưu ý: Dependency array chỉ có initialUserId để chạy 1 lần khi ID thay đổi

    // 2. Xử lý Search Realtime (Debounce)
    useEffect(() => {
        // Nếu input rỗng -> Reset
        if (!searchEmail.trim()) {
            setFoundUser(null);
            setError('');
            onUserChange?.('');
            return;
        }

        // Nếu đang trong quá trình restore (initialUserId) thì không search lại
        if (isRestoring) return;

        // Nếu email hiện tại trùng với email của user đã tìm thấy -> Không search lại
        if (foundUser && searchEmail === foundUser.email) return;

        const timer = setTimeout(async () => {
            setIsSearching(true);
            setError('');

            try {
                // API tìm user theo email chính xác
                const res = await userService.findUserByEmail(searchEmail);
                if (res.success) {
                    setFoundUser(res.data);
                    onUserChange?.(res.data.id); // Trả ID về component cha
                }
            } catch (err) {
                setFoundUser(null);
                onUserChange?.('');
                // Chỉ báo lỗi nếu email có vẻ hợp lệ (có @) để đỡ rối mắt
                if (searchEmail.includes('@')) {
                    setError('Không tìm thấy người dùng với email này');
                }
            } finally {
                setIsSearching(false);
            }
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchEmail, debounceMs, onUserChange, foundUser, isRestoring]);

    // 3. Helper: Xóa user đã chọn
    const clearUser = useCallback(() => {
        setFoundUser(null);
        setSearchEmail('');
        setError('');
        onUserChange?.('');
    }, [onUserChange]);

    // 4. Helper: Reset hoàn toàn state (về trạng thái ban đầu)
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
        setSearchEmail, // Bind vào TextInput
        foundUser,      // User object tìm thấy (để hiển thị Avatar/Tên)
        isSearching,    // Loading spinner khi search
        isRestoring,    // Loading spinner khi restore
        error,          // Message lỗi
        clearUser,
        reset
    };
};

export default useUserSearch;