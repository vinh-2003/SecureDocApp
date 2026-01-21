import { useState, useEffect, useRef } from 'react';
import fileService from '../services/fileService';

/**
 * Hook tải và quản lý ảnh bảo mật từ API
 * 
 * @param {string} pageId - ID của trang cần tải ảnh
 * @param {Object} options - Các tùy chọn
 * @param {boolean} options.enabled - Có tự động tải không (default: true)
 * @param {number} options.retryCount - Số lần retry khi lỗi (default: 2)
 * @param {number} options.retryDelay - Delay giữa các lần retry (ms) (default: 1000)
 * @returns {Object} State và actions
 */
const useSecureImage = (pageId, options = {}) => {
    const {
        enabled = true,
        retryCount = 2,
        retryDelay = 1000
    } = options;

    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Refs để track mounted state và current URL
    const isMountedRef = useRef(true);
    const currentUrlRef = useRef(null);
    const retryCountRef = useRef(0);

    // Cleanup URL helper
    const cleanupUrl = () => {
        if (currentUrlRef.current) {
            URL.revokeObjectURL(currentUrlRef.current);
            currentUrlRef.current = null;
        }
    };

    // Fetch image
    useEffect(() => {
        // Reset mounted ref
        isMountedRef.current = true;

        // Skip nếu không enabled hoặc không có pageId
        if (!enabled || !pageId) {
            setLoading(false);
            return;
        }

        const fetchImage = async () => {
            setLoading(true);
            setError(null);

            try {
                // Cleanup URL cũ trước khi fetch mới
                cleanupUrl();

                // Gọi API lấy Blob
                const response = await fileService.getPageImage(pageId);

                // Kiểm tra response hợp lệ
                if (!(response instanceof Blob)) {
                    throw new Error('Invalid response format');
                }

                // Tạo URL từ Blob
                const url = URL.createObjectURL(response);

                if (isMountedRef.current) {
                    currentUrlRef.current = url;
                    setImageUrl(url);
                    setLoading(false);
                    retryCountRef.current = 0; // Reset retry count on success
                }
            } catch (err) {
                console.error('Error loading secure image:', err);

                if (isMountedRef.current) {
                    // Retry logic
                    if (retryCountRef.current < retryCount) {
                        retryCountRef.current += 1;
                        setTimeout(fetchImage, retryDelay);
                    } else {
                        setError(err.message || 'Không thể tải ảnh');
                        setLoading(false);
                    }
                }
            }
        };

        fetchImage();

        // Cleanup khi unmount hoặc pageId thay đổi
        return () => {
            isMountedRef.current = false;
            cleanupUrl();
        };
    }, [pageId, enabled, retryCount, retryDelay]);

    // Manual refetch
    const refetch = () => {
        retryCountRef.current = 0;
        setError(null);
        setLoading(true);

        // Trigger re-fetch bằng cách set lại state
        setImageUrl(null);
    };

    return {
        imageUrl,
        loading,
        error,
        refetch,
        isLoaded: !loading && !error && !!imageUrl
    };
};

export default useSecureImage;