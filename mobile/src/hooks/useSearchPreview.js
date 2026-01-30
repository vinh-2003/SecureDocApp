import { useState, useEffect, useCallback, useRef } from 'react';
import fileService from '../services/fileService';

const useSearchPreview = (options = {}) => {
    // [FIX] Nhận thêm extraFilters để biết ngữ cảnh bộ lọc hiện tại
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
        return () => { isMounted.current = false; };
    }, []);

    // 1. Hàm gọi API Search cốt lõi
    const executeSearch = useCallback(async (searchText, filters = {}, isFull = false) => {
        // Reset nếu rỗng (cả text lẫn filter)
        if (!searchText.trim() && Object.keys(filters).length === 0) {
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
            const params = {
                keyword: searchText,
                ...filters, // Gộp bộ lọc vào params
                limit: isFull ? 100 : 5
            };

            const res = await fileService.searchFiles(params, {
                signal: abortControllerRef.current.signal
            });

            if (isMounted.current && res.data) {
                setResults(res.data || []);
                setIsFullSearch(isFull);
            }
        } catch (err) {
            if (err.name !== 'CanceledError' && isMounted.current) {
                console.log('Search error:', err);
                setError('Lỗi tìm kiếm');
                setResults([]);
            }
        } finally {
            if (isMounted.current) setIsSearching(false);
        }
    }, []);

    // 2. Effect Debounce (Chạy khi gõ phím - Chế độ Preview)
    useEffect(() => {
        // Nếu đã ở chế độ Full Search thì không chạy debounce preview đè lên
        if (isFullSearch) return;

        const timer = setTimeout(() => {
            if (keyword.trim()) {
                // [FIX] Truyền extraFilters vào đây thay vì {}
                executeSearch(keyword, extraFilters, false); 
            } else if (Object.keys(extraFilters).length > 0) {
                 // Nếu không có keyword nhưng có filter, cũng có thể search (tùy logic, ở đây mình để search luôn)
                 executeSearch(keyword, extraFilters, false);
            } else {
                setResults([]);
            }
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [keyword, debounceMs, executeSearch, extraFilters]); // [FIX] Thêm extraFilters vào dependency

    // 3. Handler: Trigger Search thủ công (Enter hoặc Filter)
    const triggerSearch = useCallback((filters = {}) => {
        // Khi gọi hàm này, luôn coi là Full Search
        executeSearch(keyword, filters, true);
    }, [keyword, executeSearch]);

    // 4. Handler: Thay đổi keyword
    const handleKeywordChange = useCallback((text) => {
        setKeyword(text);
        setIsFullSearch(false); // Reset về preview khi người dùng sửa text
    }, []);

    const reset = useCallback(() => {
        setKeyword('');
        setResults([]);
        setIsSearching(false);
        setIsFullSearch(false);
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