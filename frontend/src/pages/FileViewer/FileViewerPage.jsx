// src/pages/FileViewerPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import fileService from '../../services/fileService';
import SecureImage from '../../components/FileViewer/SecureImage';
import RequestAccessModal from '../../components/FileViewer/RequestAccessModal';
import ManageAccessModal from '../../components/FileViewer/ManageAccessModal';
import { 
    FaArrowLeft, FaSearchPlus, FaSearchMinus, FaLock, FaUnlock, 
    FaExpand, FaCompress, FaChevronLeft, FaChevronRight, FaList, FaColumns, 
    FaUserCog, FaDownload
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const FileViewerPage = () => {
    const { fileId } = useParams();
    const navigate = useNavigate();

    // --- STATE ---
    const [pages, setPages] = useState([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(80);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [showSidebar, setShowSidebar] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);

    const [showManageModal, setShowManageModal] = useState(false); // State cho modal mới
    const [isOwner, setIsOwner] = useState(false); // Cần logic check owner từ BE hoặc so sánh ID

    // --- LOAD DATA ---
    useEffect(() => {
        fetchPages();
        checkOwnership();
        // eslint-disable-next-line
    }, [fileId]);

    const fetchPages = async () => {
        try {
            setLoading(true);
            const res = await fileService.getFilePages(fileId);
            if (res.success) {
                setPages(res.data);
            }
        } catch (error) {
            toast.error("Không thể tải tài liệu.");
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS ---

    const handleDownload = async (fileId) => {
    const toastId = toast.loading('Đang chuẩn bị tải file...');
    try {
      const fileDetails = await fileService.getFileDetails(fileId);
      const fileName = fileDetails?.data?.name || "downloaded_file";

      const response = await fileService.downloadFile(fileId);
      
      // Tạo URL ảo từ Blob dữ liệu
      const url = window.URL.createObjectURL(new Blob([response]));
      
      // Tạo thẻ A ảo để kích hoạt tải xuống
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName); // Đặt tên file khi tải về
      document.body.appendChild(link);
      link.click();
      
      // Dọn dẹp
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss(toastId);
      toast.success("Đã tải xuống thành công!");
    } catch (error) {
      toast.dismiss(toastId);

    let message = "Lỗi khi tải file. Có thể file đã bị xóa hoặc không có quyền.";

    // 🔹 Kiểm tra nếu backend trả về JSON lỗi nhưng ở dạng Blob
    if (error.response?.data instanceof Blob) {
        try {
        const text = await error.response.data.text(); // đọc nội dung blob
        const json = JSON.parse(text);
        if (json.message) message = json.message;
        } catch (parseError) {
        console.error("Không thể parse lỗi blob:", parseError);
        }
    } else if (error.response?.data?.message) {
        message = error.response.data.message;
    }

    console.error("📦 Backend data:", error.response?.data);
    console.error("📄 Status:", error.response?.status);
    toast.error(message);
    }
  };


    // 1. Chuyển trang
    const goToPage = useCallback((index) => {
        if (index >= 0 && index < pages.length) {
            setCurrentPageIndex(index);
            // Scroll trang đó vào tầm nhìn trong sidebar
            const thumbId = `thumb-${index}`;
            const element = document.getElementById(thumbId);
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [pages.length]);

    const nextPage = () => goToPage(currentPageIndex + 1);
    const prevPage = () => goToPage(currentPageIndex - 1);

    // 2. Bắt sự kiện bàn phím (Mũi tên trái/phải)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPageIndex, pages.length]); // eslint-disable-line

    // 3. Xử lý Fullscreen trình duyệt
    const toggleBrowserFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // 4. Chủ sở hữu khoá/mở trang
    const handleToggleLock = async () => {
        const currentPage = pages[currentPageIndex];
        try {
            const res = await fileService.togglePageLock(currentPage.id);
            if (res.success) {
                const newLockStatus = res.data;
                setPages(prev => prev.map((p, idx) => 
                    idx === currentPageIndex ? { ...p, locked: newLockStatus, isLocked: newLockStatus } : p
                ));
                toast.success(newLockStatus ? "Đã khoá trang." : "Đã mở khoá.");
            }
        } catch (error) {
            toast.error("Lỗi khi thay đổi trạng thái.");
        }
    };

    // 1. Thêm hàm kiểm tra quyền sở hữu
    const checkOwnership = async () => {
        try {
            // BƯỚC A: Lấy ID người dùng hiện tại (Từ LocalStorage hoặc Context)
            // Giả sử khi login bạn lưu thông tin user vào localStorage với key 'user'
            const userStr = localStorage.getItem('user'); 
            if (!userStr) return;
            
            const currentUser = JSON.parse(userStr);
            const currentUserId = currentUser.userId; // (Hoặc currentUser._id tuỳ API login trả về)

            // BƯỚC B: Lấy thông tin chi tiết File để biết ai là chủ (ownerId)
            // Gọi hàm getFileDetails mà ta đã khai báo trong fileService
            const res = await fileService.getFileDetails(fileId);
            
            if (res.success) {
                const fileData = res.data;
                
                // BƯỚC C: So sánh
                // Nếu ID người đang login trùng với ownerId của file -> Là chủ
                if (currentUserId === fileData.owner.id) {
                    setIsOwner(true);
                }
            }
        } catch (error) {
            console.error("Lỗi kiểm tra quyền sở hữu:", error);
        }
    };

    const currentPage = pages[currentPageIndex];

    if (loading) return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white font-medium">
            Đang tải trang...
        </div>
    );

    return (
        // Wrapper chính: fixed z-50 để đè lên mọi thứ khác (Header/Sidebar cũ của App)
        <div className="fixed inset-0 z-50 flex flex-col h-screen w-screen bg-gray-900 text-gray-800 overflow-hidden">
            
            {/* ================= HEADER TOOLBAR ================= */}
            <div className="h-14 bg-gray-800 border-b border-gray-700 shadow-md flex items-center justify-between px-4 shrink-0 text-white">
                
                {/* Left: Back & Title */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition"
                        title="Quay lại"
                    >
                        <FaArrowLeft />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-md text-gray-100">
                            Trình đọc tài liệu
                        </h1>
                        <span className="text-xs text-gray-400">
                            Trang {currentPageIndex + 1} / {pages.length}
                        </span>
                    </div>
                </div>

                {/* Center: Page Navigation & Zoom */}
                <div className="hidden md:flex items-center bg-gray-700 rounded-lg p-1 gap-1 border border-gray-600">
                    {/* Page Nav */}
                    <button onClick={prevPage} disabled={currentPageIndex === 0} className="p-1.5 hover:bg-gray-600 rounded disabled:opacity-30">
                        <FaChevronLeft size={12} />
                    </button>
                    <span className="text-xs font-mono w-16 text-center border-l border-r border-gray-600 px-2">
                        {currentPageIndex + 1} / {pages.length}
                    </span>
                    <button onClick={nextPage} disabled={currentPageIndex === pages.length - 1} className="p-1.5 hover:bg-gray-600 rounded disabled:opacity-30">
                        <FaChevronRight size={12} />
                    </button>
                    
                    {/* Divider */}
                    <div className="w-[1px] h-4 bg-gray-500 mx-1"></div>

                    {/* Zoom */}
                    <button onClick={() => setZoomLevel(z => Math.max(30, z - 10))} className="p-1.5 hover:bg-gray-600 rounded"><FaSearchMinus size={12} /></button>
                    <span className="text-xs font-bold w-10 text-center">{zoomLevel}%</span>
                    <button onClick={() => setZoomLevel(z => Math.min(100, z + 10))} className="p-1.5 hover:bg-gray-600 rounded"><FaSearchPlus size={12} /></button>
                </div>

                {/* Right: View Options */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            console.log(fileId);
                            handleDownload(fileId);
                        }}
                        className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition"
                        title="Tải file xuống"
                    >
                        <FaDownload />
                    </button>
                    <button 
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-2 rounded transition ${showSidebar ? 'bg-gray-700 text-blue-400' : 'hover:bg-gray-700 text-gray-300'}`}
                        title="Bật/Tắt Sidebar"
                    >
                        {showSidebar ? <FaColumns /> : <FaList />}
                    </button>
                    
                    <button 
                        onClick={toggleBrowserFullscreen}
                        className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition"
                        title="Toàn màn hình"
                    >
                        {isFullscreen ? <FaCompress /> : <FaExpand />}
                    </button>

                    {/* NÚT QUẢN LÝ (Chỉ hiện cho Owner) */}
                    {/* Giả sử bạn đã có biến isOwner */}
                    {isOwner && (
                        <button 
                            onClick={() => setShowManageModal(true)}
                            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded shadow transition"
                        >
                            <FaUserCog /> <span className="hidden md:inline">Quản lý quyền</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ================= BODY CONTENT ================= */}
            <div className="flex flex-1 overflow-hidden relative">
                
                {/* A. SIDEBAR (THUMBNAILS) - Có thể ẩn đi */}
                {showSidebar && (
                    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col gap-3 p-3 overflow-y-auto custom-scrollbar shrink-0 transition-all duration-300">
                        {pages.map((page, index) => (
                            <div 
                                id={`thumb-${index}`}
                                key={page.id}
                                onClick={() => goToPage(index)}
                                className={`relative cursor-pointer group rounded overflow-hidden border-2 transition-all shrink-0 ${
                                    index === currentPageIndex 
                                        ? 'border-blue-500 ring-2 ring-blue-500/20' 
                                        : 'border-transparent hover:border-gray-500'
                                }`}
                            >
                                <SecureImage 
                                    pageId={page.id} 
                                    className="w-full h-auto object-contain bg-white min-h-[80px]" 
                                    alt={`Thumb ${index + 1}`}
                                />
                                
                                <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-tl font-mono">
                                    {index + 1}
                                </div>

                                {page.locked && (
                                    <div className={`absolute inset-0 flex items-center justify-center bg-black/20 ${!page.canViewClear ? 'backdrop-blur-[1px]' : ''}`}>
                                        <div className="bg-yellow-500 text-white p-1 rounded-full shadow-sm">
                                            <FaLock size={10} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* B. MAIN VIEWPORT */}
                <div className="flex-1 bg-gray-900 overflow-auto flex justify-center p-4 md:p-8 relative custom-scrollbar select-none">
                    
                    {/* Navigation Buttons (Floating on Hover) */}
                    <button 
                        onClick={prevPage} disabled={currentPageIndex === 0}
                        className="fixed left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-black/40 hover:bg-black/70 text-white rounded-full transition disabled:hidden"
                    >
                        <FaChevronLeft />
                    </button>
                    <button 
                        onClick={nextPage} disabled={currentPageIndex === pages.length - 1}
                        className="fixed right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-black/40 hover:bg-black/70 text-white rounded-full transition disabled:hidden"
                    >
                        <FaChevronRight />
                    </button>

                    {currentPage && (
                        <div 
                            className="relative shadow-2xl transition-all duration-200 bg-white min-h-[500px]"
                            style={{ 
                                width: `${zoomLevel}%`, 
                                maxWidth: 'none', 
                                alignSelf: 'flex-start',
                                marginTop: '10px',
                                marginBottom: '50px'
                            }}
                        >
                            {/* --- ẢNH TRANG CHÍNH --- */}
                            <SecureImage 
                                pageId={currentPage.id} 
                                className={`w-full h-auto block ${!currentPage.canViewClear ? 'filter blur-[5px] opacity-80' : ''}`}
                                alt={`Page ${currentPageIndex + 1}`}
                            />

                            {/* --- OVERLAY KHI BỊ KHOÁ --- */}
                            {currentPage.locked && !currentPage.canViewClear && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                    <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-2xl text-center max-w-sm border border-gray-200 animate-fade-in-up">
                                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                            <FaLock size={28} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Trang bị giới hạn</h3>
                                        <p className="text-sm text-gray-500 mb-6 mt-2 leading-relaxed">
                                            Bạn cần yêu cầu quyền truy cập từ chủ sở hữu để xem nội dung trang này.
                                        </p>
                                        <button 
                                            onClick={() => setShowRequestModal(true)}
                                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-lg transition-transform active:scale-95"
                                        >
                                            Gửi yêu cầu mở khoá
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* --- OVERLAY CHO OWNER (QUẢN LÝ) --- */}
                            {currentPage.canViewClear && (
                                <div className="absolute top-4 right-4 z-20 group">
                                    <button 
                                        onClick={handleToggleLock}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded shadow text-xs font-bold transition-all ${
                                            currentPage.locked 
                                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                            : 'bg-gray-100 text-gray-500 hover:text-blue-600 hover:bg-white opacity-0 group-hover:opacity-100'
                                        }`}
                                    >
                                        {currentPage.locked ? <><FaLock size={10} /> Đang khoá</> : <><FaUnlock size={10} /> Khoá trang</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL */}
            <RequestAccessModal 
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                fileId={fileId}
                pages={pages}
            />

            {/* Nhúng Modal mới vào cuối trang */}
             <ManageAccessModal 
                isOpen={showManageModal}
                onClose={() => setShowManageModal(false)}
                fileId={fileId}
             />
        </div>
    );
};

export default FileViewerPage;