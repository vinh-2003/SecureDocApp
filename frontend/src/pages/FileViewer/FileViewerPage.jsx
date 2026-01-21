import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

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

/**
 * =============================================================================
 * FILE VIEWER PAGE
 * =============================================================================
 * Trang xem chi tiết file với các tính năng: 
 * - Xem từng trang với zoom
 * - Sidebar thumbnails
 * - Fullscreen mode
 * - Lock/unlock pages (owner only)
 * - Request access (viewer)
 * =============================================================================
 */
const FileViewerPage = () => {
    const { fileId } = useParams();

    // Modal states
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);

    // File viewer hook
    const viewer = useFileViewer(fileId);

    // Loading state
    if (viewer.loading) {
        return <ViewerLoading />;
    }

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

                {/* Main Content - Truyền thêm isOwner */}
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

/**
 * Loading state component
 */
const ViewerLoading = () => (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <Loading
            variant="inline"
            size="lg"
            color="blue"
            text="Đang tải tài liệu..."
        />
    </div>
);

export default FileViewerPage;