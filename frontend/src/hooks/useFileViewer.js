import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import fileService from '../services/fileService';

/**
 * Hook quản lý logic cho FileViewerPage
 * Cập nhật: Phân loại file (Document/Video/Unsupported) trước khi load
 * * @param {string} fileId - ID của file
 * @returns {Object} State và handlers
 */
const useFileViewer = (fileId) => {
    const navigate = useNavigate();

    // ==========================================
    // 1. DATA & VIEW STATE
    // ==========================================
    const [fileInfo, setFileInfo] = useState(null);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // LOADING | DOCUMENT | VIDEO | UNSUPPORTED
    const [viewType, setViewType] = useState('LOADING'); 

    // ==========================================
    // 2. DOCUMENT UI STATE
    // ==========================================
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(80);
    const [showSidebar, setShowSidebar] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // ==========================================
    // 3. PERMISSION STATE
    // ==========================================
    const [isOwner, setIsOwner] = useState(false);

    // Ref để tránh dependency cycle trong Event Listener
    const isFullscreenRef = useRef(isFullscreen);

    useEffect(() => {
        isFullscreenRef.current = isFullscreen;
    }, [isFullscreen]);

    // ==========================================
    // 4. INITIALIZATION LOGIC
    // ==========================================
    
    // Hàm lấy danh sách trang (Chỉ gọi khi xác định là Document)
    const fetchPagesData = async () => {
        try {
            const res = await fileService.getFilePages(fileId);
            if (res.success) {
                setPages(res.data);
            }
        } catch (error) {
            console.error('Fetch pages error:', error);
            // Nếu lỗi load pages, chuyển sang view UNSUPPORTED để cho user tải về
            setViewType('UNSUPPORTED'); 
        }
    };

    // Hàm khởi tạo chính
    const initViewer = useCallback(async () => {
        try {
            setLoading(true);
            
            // B1: Lấy thông tin chi tiết file trước
            const detailRes = await fileService.getFileDetails(fileId);
            if (!detailRes.success) throw new Error("Không thể lấy thông tin file");

            const fileData = detailRes.data;
            setFileInfo(fileData);

            // B2: Kiểm tra quyền Owner
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const currentUser = JSON.parse(userStr);
                // So sánh ID user hiện tại với owner của file
                if (fileData.owner && currentUser.userId === fileData.owner.id) {
                    setIsOwner(true);
                }
            }

            // B3: Phân loại File dựa trên MimeType hoặc Extension
            const mime = fileData.mimeType || '';
            const name = fileData.name?.toLowerCase() || '';

            // CASE A: Document (PDF, Word) -> Cần fetch Pages
            // Backend convert PDF/Word thành các ảnh trang (Page entity)
            if (mime === 'application/pdf' || name.endsWith('.docx') || name.endsWith('.doc')) {
                setViewType('DOCUMENT');
                await fetchPagesData(); // Gọi hàm lấy trang
            } 
            // CASE B: Video (Hỗ trợ play trực tiếp nếu trình duyệt hỗ trợ)
            else if (mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm')) {
                setViewType('VIDEO');
            }
            // CASE C: Image hoặc các file khác (Zip, Exe...) -> Coi là Unsupported trong Viewer này
            // (Lưu ý: Ảnh có thể xem inline ở tab khác, nhưng nếu vào Viewer này thì hiện nút tải)
            else {
                setViewType('UNSUPPORTED');
            }

        } catch (error) {
            console.error('Init viewer error:', error);
            toast.error('Không thể truy cập tài liệu này.');
            navigate(-1); 
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileId, navigate]);

    // Chạy init khi component mount hoặc fileId thay đổi
    useEffect(() => {
        initViewer();
    }, [initViewer]);


    // ==========================================
    // 5. NAVIGATION & ACTIONS (DOCUMENT MODE)
    // ==========================================

    const goToPage = useCallback((index) => {
        if (index >= 0 && index < pages.length) {
            setCurrentPageIndex(index);
            const element = document.getElementById(`thumb-${index}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [pages.length]);

    const nextPage = useCallback(() => goToPage(currentPageIndex + 1), [currentPageIndex, goToPage]);
    const prevPage = useCallback(() => goToPage(currentPageIndex - 1), [currentPageIndex, goToPage]);

    // Zoom
    const zoomIn = useCallback(() => setZoomLevel(prev => Math.min(200, prev + 10)), []);
    const zoomOut = useCallback(() => setZoomLevel(prev => Math.max(30, prev - 10)), []);
    const resetZoom = useCallback(() => setZoomLevel(80), []);
    
    // UI Toggles
    const toggleSidebar = useCallback(() => setShowSidebar(prev => !prev), []);
    
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Fullscreen listener
    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Keyboard navigation (Chỉ active khi là Document)
    useEffect(() => {
        if (viewType !== 'DOCUMENT') return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextPage, prevPage, viewType]);

    // ==========================================
    // 6. BUSINESS ACTIONS
    // ==========================================

    // Toggle Page Lock (Owner only)
    const togglePageLock = useCallback(async () => {
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
                    idx === currentPageIndex ? { ...p, locked: newLockStatus, isLocked: newLockStatus } : p
                ));
                toast.success(newLockStatus ? 'Đã khóa trang.' : 'Đã mở khóa.');
            }
        } catch (error) {
            toast.error('Lỗi khi thay đổi trạng thái.');
        }
    }, [pages, currentPageIndex, isOwner]);

    // Download File (Dùng chung cho cả Document, Video, Unsupported)
    const downloadFile = useCallback(async () => {
        const toastId = toast.loading('Đang chuẩn bị tải file...');
        try {
            const fileName = fileInfo?.name || 'downloaded_file';
            // Gọi API download từ service
            const response = await fileService.downloadFile(fileId);
            
            // Tạo link tải ảo
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.dismiss(toastId);
            toast.success('Đã tải xuống thành công!');
        } catch (error) {
            toast.dismiss(toastId);
            let message = 'Lỗi khi tải file.';
            
            // Xử lý lỗi Blob hoặc JSON error message
            if (error.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    const json = JSON.parse(text);
                    if (json.message) message = json.message;
                } catch (e) { console.error(e); }
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            }
            toast.error(message);
        }
    }, [fileId, fileInfo]);

    // ==========================================
    // 7. RETURN
    // ==========================================
    
    return {
        // Data & Status
        fileInfo,
        viewType, // Quan trọng: Component sẽ dựa vào đây để render
        loading,
        isOwner,
        
        // Document Data
        pages,
        currentPageIndex,
        currentPage: pages[currentPageIndex] || null,
        totalPages: pages.length,
        
        // Navigation Logic
        canGoNext: currentPageIndex < pages.length - 1,
        canGoPrev: currentPageIndex > 0,
        goToPage,
        nextPage,
        prevPage,

        // Zoom Logic
        zoomLevel,
        zoomIn,
        zoomOut,
        resetZoom,
        setZoomLevel,

        // UI Actions
        showSidebar,
        toggleSidebar,
        isFullscreen,
        toggleFullscreen,
        
        // Business Actions
        togglePageLock,
        downloadFile,
        
        // Helper
        refetch: initViewer
    };
};

export default useFileViewer;