import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import fileService from '../services/fileService';

/**
 * Hook quản lý search preview trong Header
 * 
 * @param {Object} options - Các tùy chọn
 * @param {number} options.debounceMs - Thời gian debounce (ms)
 * @param {number} options.previewLimit - Số kết quả preview tối đa
 * @returns {Object} State và handlers
 */
const useSearchPreview = (options = {}) => {
    const { debounceMs = 500, previewLimit = 5 } = options;

    const [searchParams] = useSearchParams();
    const [keyword, setKeyword] = useState('');
    const [previewResults, setPreviewResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Sync keyword từ URL khi F5/reload
    useEffect(() => {
        const urlKeyword = searchParams.get('keyword');
        setKeyword(urlKeyword || '');
    }, [searchParams]);

    // Debounce search preview
    useEffect(() => {
        if (!keyword.trim()) {
            setPreviewResults([]);
            setShowDropdown(false);
            return;
        }

        // Không hiện preview nếu keyword đã khớp URL (đã Enter rồi)
        if (keyword === searchParams.get('keyword')) {
            setShowDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fileService.searchFiles({
                    keyword,
                    page: 0,
                    size: previewLimit
                });
                if (res.success) {
                    setPreviewResults(res.data);
                    setShowDropdown(true);
                }
            } catch (error) {
                console.error('Search preview error:', error);
                setPreviewResults([]);
            } finally {
                setIsSearching(false);
            }
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [keyword, searchParams, debounceMs, previewLimit]);

    // Handlers
    const handleKeywordChange = useCallback((value) => {
        setKeyword(value);
    }, []);

    const handleFocus = useCallback(() => {
        if (keyword.trim() && keyword !== searchParams.get('keyword')) {
            setShowDropdown(true);
        }
    }, [keyword, searchParams]);

    const closeDropdown = useCallback(() => {
        setShowDropdown(false);
    }, []);

    const reset = useCallback(() => {
        setKeyword('');
        setPreviewResults([]);
        setShowDropdown(false);
    }, []);

    // Lấy params hiện tại để truyền vào AdvancedSearch
    const getCurrentParams = useCallback(() => {
        const current = Object.fromEntries([...searchParams]);
        if (current.inTrash === 'true') current.inTrash = true;
        else if (current.inTrash === 'false') current.inTrash = false;
        current.keyword = keyword;
        return current;
    }, [searchParams, keyword]);

    return {
        keyword,
        setKeyword: handleKeywordChange,
        previewResults,
        isSearching,
        showDropdown,
        setShowDropdown,
        handleFocus,
        closeDropdown,
        reset,
        getCurrentParams
    };
};

export default useSearchPreview;