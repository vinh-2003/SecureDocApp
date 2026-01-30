import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFileArchive, FaDownload, FaArrowLeft } from 'react-icons/fa';

// Components
import { Loading } from '../../components/Common';
import {
    ViewerToolbar,
    ViewerSidebar,
    ViewerContent,
    RequestAccessModal,
    ManageAccessModal
} from '../../components/FileViewer';

// Hooks
import { useFileViewer } from '../../hooks';

const FileViewerPage = () => {
    const { fileId } = useParams();
    const navigate = useNavigate();

    // Modal states
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);

    // File viewer hook
    const viewer = useFileViewer(fileId);

    // 1. Loading State
    if (viewer.loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
                <Loading variant="inline" size="lg" color="blue" text="Đang tải tài liệu..." />
            </div>
        );
    }

    // 2. Unsupported / Generic File View (Zip, Exe, Text, etc.)
    // Hiển thị màn hình thông báo + Nút download
    if (viewer.viewType === 'UNSUPPORTED' || viewer.viewType === 'VIDEO') {
        // Lưu ý: Nếu muốn hỗ trợ Video Player, bạn có thể tách case VIDEO ra riêng ở đây
        // Hiện tại gộp chung vào màn hình Download-only cho đơn giản, hoặc làm như sau:
        return (
            <div className="fixed inset-0 z-50 flex flex-col h-screen w-screen bg-gray-50 text-gray-800">
                {/* Simple Header */}
                <div className="h-14 bg-white border-b flex items-center px-4 shadow-sm">
                    <button onClick={() => navigate(-1)} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                        <FaArrowLeft />
                    </button>
                    <h1 className="font-semibold text-lg truncate">
                        {viewer.fileInfo?.name || 'Chi tiết file'}
                    </h1>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                        {viewer.viewType === 'VIDEO' ? (
                             <span className="text-4xl">🎬</span>
                        ) : (
                             <FaFileArchive className="text-gray-400 text-5xl" />
                        )}
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">
                        {viewer.viewType === 'VIDEO' ? 'Video clip' : 'Không hỗ trợ xem trước'}
                    </h2>
                    
                    <p className="text-gray-500 mb-8 max-w-md">
                        {viewer.viewType === 'VIDEO' 
                            ? 'Trình duyệt hiện tại chưa hỗ trợ phát video trực tiếp trong viewer này. Vui lòng tải xuống để xem.'
                            : 'Định dạng file này không hỗ trợ xem trực tiếp trên trình duyệt hoặc cần phần mềm chuyên dụng.'}
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={viewer.downloadFile}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg transition transform hover:-translate-y-0.5"
                        >
                            <FaDownload /> Tải xuống ({formatBytes(viewer.fileInfo?.size || 0)})
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Document View (PDF/Word) - Giữ nguyên giao diện cũ
    return (
        <div className="fixed inset-0 z-50 flex flex-col h-screen w-screen bg-gray-900 text-gray-800 overflow-hidden">
            {/* Toolbar */}
            <ViewerToolbar
                currentPage={viewer.currentPageIndex + 1}
                totalPages={viewer.totalPages}
                zoomLevel={viewer.zoomLevel}
                showSidebar={viewer.showSidebar}
                isFullscreen={viewer.isFullscreen}
                isOwner={viewer.isOwner}
                canGoNext={viewer.canGoNext}
                canGoPrev={viewer.canGoPrev}
                onPrevPage={viewer.prevPage}
                onNextPage={viewer.nextPage}
                onZoomIn={viewer.zoomIn}
                onZoomOut={viewer.zoomOut}
                onToggleSidebar={viewer.toggleSidebar}
                onToggleFullscreen={viewer.toggleFullscreen}
                onDownload={viewer.downloadFile}
                onManageAccess={() => setShowManageModal(true)}
            />

            {/* Body */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar */}
                <ViewerSidebar
                    pages={viewer.pages}
                    currentPageIndex={viewer.currentPageIndex}
                    onPageClick={viewer.goToPage}
                    isVisible={viewer.showSidebar}
                />

                {/* Main Content */}
                <ViewerContent
                    currentPage={viewer.currentPage}
                    currentPageIndex={viewer.currentPageIndex}
                    zoomLevel={viewer.zoomLevel}
                    canGoNext={viewer.canGoNext}
                    canGoPrev={viewer.canGoPrev}
                    isOwner={viewer.isOwner}
                    onPrevPage={viewer.prevPage}
                    onNextPage={viewer.nextPage}
                    onToggleLock={viewer.togglePageLock}
                    onRequestAccess={() => setShowRequestModal(true)}
                />
            </div>

            {/* Modals */}
            <RequestAccessModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                fileId={fileId}
                pages={viewer.pages}
            />

            <ManageAccessModal
                isOpen={showManageModal}
                onClose={() => setShowManageModal(false)}
                fileId={fileId}
            />
        </div>
    );
};

// Helper function format bytes
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default FileViewerPage;