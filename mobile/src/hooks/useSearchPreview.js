import { useState, useEffect, useCallback, useRef } from 'react';
import fileService from '../services/fileService';
import userService from '../services/userService';

/**
 * Hook quản lý search preview và full search
 */
const useSearchPreview = (options = {}) => {
    const { debounceMs = 500, extraFilters = {} } = options;

    // State
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isFullSearch, setIsFullSearch] = useState(false);
    const [error, setError] = useState(null);

    // Refs
    const abortControllerRef = useRef(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { 
            isMounted.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    /**
     * Hàm gọi API Search cốt lõi
     */
    const executeSearch = useCallback(async (searchText, filters = {}, isFull = false) => {
        // Reset nếu rỗng (cả text lẫn filter)
        const hasKeyword = searchText && searchText.trim().length > 0;
        const hasFilters = Object.keys(filters).filter(k => {
            const v = filters[k];
            return v !== null && v !== undefined && v !== '' && v !== false;
        }).length > 0;

        if (!hasKeyword && !hasFilters) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        setError(null);

        // Cancel request cũ
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            // Build params theo đúng API spec
            const params = {};
            
            // 1. Keyword
            if (hasKeyword) {
                params.keyword = searchText.trim();
            }

            // 2. File Type - gửi trực tiếp
            if (filters.fileType) {
                params.fileType = filters.fileType;
            }

            // 3. Owner - Nếu có ownerEmail thì cần resolve sang ownerId
            if (filters.ownerEmail) {
                try {
                    const userRes = await userService.findUserByEmail(filters.ownerEmail);
                    if (userRes.success && userRes.data && userRes.data.id) {
                        params.ownerId = userRes.data.id;
                    }
                } catch (e) {
                    console.log('Could not resolve owner email to id:', e);
                }
            }
            // Nếu đã có ownerId trực tiếp thì dùng luôn
            if (filters.ownerId) {
                params.ownerId = filters.ownerId;
            }

            // 4. Location ID - gửi trực tiếp
            if (filters.locationId) {
                params.locationId = filters.locationId;
            }

            // 5. Date range - đảm bảo format YYYY-MM-DD
            if (filters.fromDate) {
                // Nếu là string thì dùng luôn
                if (typeof filters.fromDate === 'string') {
                    params.fromDate = filters.fromDate;
                } else if (filters.fromDate instanceof Date) {
                    const d = filters.fromDate;
                    params.fromDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                }
            }
            if (filters.toDate) {
                if (typeof filters.toDate === 'string') {
                    params.toDate = filters.toDate;
                } else if (filters.toDate instanceof Date) {
                    const d = filters.toDate;
                    params.toDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                }
            }

            // 6. Trash
            if (filters.inTrash === true) {
                params.inTrash = true;
            }

            // 7. Pagination
            params.page = 0;
            params.size = isFull ? 100 : 10;

            // DEBUG
            console.log('🔍 Search params:', JSON.stringify(params, null, 2));

            const res = await fileService.searchFiles(params, {
                signal: abortControllerRef.current.signal
            });

            console.log('📦 Search response count:', res.data?.length || res.data?.content?.length || 0);

            if (isMounted.current) {
                const data = res.data?.content || res.data || [];
                setResults(Array.isArray(data) ? data : []);
                setIsFullSearch(isFull);
            }
        } catch (err) {
            if (err.name !== 'CanceledError' && err.name !== 'AbortError' && isMounted.current) {
                console.log('❌ Search error:', err);
                setError('Lỗi tìm kiếm');
                setResults([]);
            }
        } finally {
            if (isMounted.current) {
                setIsSearching(false);
            }
        }
    }, []);

    /**
     * Effect Debounce - Chạy khi gõ phím (Preview mode)
     */
    useEffect(() => {
        if (isFullSearch) return;

        const timer = setTimeout(() => {
            executeSearch(keyword, extraFilters, false);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [keyword, debounceMs, executeSearch, extraFilters, isFullSearch]);

    /**
     * Trigger Search thủ công (Enter hoặc Apply Filter)
     */
    const triggerSearch = useCallback((filters = {}) => {
        console.log('🚀 Trigger search with filters:', JSON.stringify(filters, null, 2));
        setIsFullSearch(true);
        executeSearch(keyword, filters, true);
    }, [keyword, executeSearch]);

    /**
     * Thay đổi keyword
     */
    const handleKeywordChange = useCallback((text) => {
        setKeyword(text);
        setIsFullSearch(false);
    }, []);

    /**
     * Reset tất cả
     */
    const reset = useCallback(() => {
        setKeyword('');
        setResults([]);
        setIsSearching(false);
        setIsFullSearch(false);
        setError(null);
    }, []);

    return {
        keyword,
        setKeyword: handleKeywordChange,
        results,
        isSearching,
        isFullSearch,
        triggerSearch,
        reset,
        error
    };
};

export default useSearchPreview;