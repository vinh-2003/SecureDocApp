import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import fileService from '../services/fileService';

/**
 * Hook quản lý logic cho FileViewerPage
 * 
 * @param {string} fileId - ID của file
 * @returns {Object} State và handlers
 */
const useFileViewer = (fileId) => {
    const navigate = useNavigate();

    // Page state
    const [pages, setPages] = useState([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // Zoom state
    const [zoomLevel, setZoomLevel] = useState(80);

    // UI state
    const [showSidebar, setShowSidebar] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Owner state
    const [isOwner, setIsOwner] = useState(false);
    const [fileInfo, setFileInfo] = useState(null);

    // Ref để tránh dependency cycle
    const isFullscreenRef = useRef(isFullscreen);

    useEffect(() => {
        isFullscreenRef.current = isFullscreen;
    }, [isFullscreen]);

    // Fetch pages
    const fetchPages = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fileService.getFilePages(fileId);
            if (res.success) {
                setPages(res.data);
            }
        } catch (error) {
            console.error('Fetch pages error:', error);
            toast.error('Không thể tải tài liệu.');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    }, [fileId, navigate]);

    // Check ownership
    const checkOwnership = useCallback(async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;

            const currentUser = JSON.parse(userStr);
            const res = await fileService.getFileDetails(fileId);

            if (res.success) {
                setFileInfo(res.data);
                if (currentUser.userId === res.data.owner?.id) {
                    setIsOwner(true);
                }
            }
        } catch (error) {
            console.error('Check ownership error:', error);
        }
    }, [fileId]);

    // Initial load
    useEffect(() => {
        fetchPages();
        checkOwnership();
    }, [fetchPages, checkOwnership]);

    // Navigation
    const goToPage = useCallback((index) => {
        if (index >= 0 && index < pages.length) {
            setCurrentPageIndex(index);

            const element = document.getElementById(`thumb-${index}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [pages.length]);

    const nextPage = useCallback(() => {
        goToPage(currentPageIndex + 1);
    }, [currentPageIndex, goToPage]);

    const prevPage = useCallback(() => {
        goToPage(currentPageIndex - 1);
    }, [currentPageIndex, goToPage]);

    // Fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
            if (e.key === 'Escape' && isFullscreenRef.current) {
                // Fullscreen will be handled by browser
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextPage, prevPage]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Zoom
    const zoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(200, prev + 10));
    }, []);

    const zoomOut = useCallback(() => {
        setZoomLevel(prev => Math.max(30, prev - 10));
    }, []);

    const resetZoom = useCallback(() => {
        setZoomLevel(80);
    }, []);

    // Toggle sidebar
    const toggleSidebar = useCallback(() => {
        setShowSidebar(prev => !prev);
    }, []);

    // Toggle page lock (chỉ owner mới dùng được)
    const togglePageLock = useCallback(async () => {
        // Kiểm tra quyền owner
        if (!isOwner) {
            toast.error('Bạn không có quyền thực hiện hành động này.');
            return;
        }

        const currentPage = pages[currentPageIndex];
        if (!currentPage) return;

        try {
            const res = await fileService.togglePageLock(currentPage.id);
            if (res.success) {
                const newLockStatus = res.data;
                setPages(prev => prev.map((p, idx) =>
                    idx === currentPageIndex
                        ? { ...p, locked: newLockStatus, isLocked: newLockStatus }
                        : p
                ));
                toast.success(newLockStatus ? 'Đã khóa trang.' : 'Đã mở khóa.');
            }
        } catch (error) {
            toast.error('Lỗi khi thay đổi trạng thái.');
        }
    }, [pages, currentPageIndex, isOwner]);

    // Download file
    const downloadFile = useCallback(async () => {
        const toastId = toast.loading('Đang chuẩn bị tải file...');

        try {
            const fileName = fileInfo?.name || 'downloaded_file';
            const response = await fileService.downloadFile(fileId);

            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.dismiss(toastId);
            toast.success('Đã tải xuống thành công!');
        } catch (error) {
            toast.dismiss(toastId);

            let message = 'Lỗi khi tải file. ';

            if (error.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    const json = JSON.parse(text);
                    if (json.message) message = json.message;
                } catch (parseError) {
                    console.error('Parse error:', parseError);
                }
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            }

            toast.error(message);
        }
    }, [fileId, fileInfo]);

    // Current page
    const currentPage = pages[currentPageIndex] || null;

    return {
        // State
        pages,
        currentPageIndex,
        currentPage,
        loading,
        zoomLevel,
        showSidebar,
        isFullscreen,
        isOwner,
        fileInfo,

        // Computed
        totalPages: pages.length,
        canGoNext: currentPageIndex < pages.length - 1,
        canGoPrev: currentPageIndex > 0,

        // Navigation
        goToPage,
        nextPage,
        prevPage,

        // Zoom
        zoomIn,
        zoomOut,
        resetZoom,
        setZoomLevel,

        // Actions
        toggleSidebar,
        toggleFullscreen,
        togglePageLock,
        downloadFile,
        refetch: fetchPages
    };
};

export default useFileViewer;