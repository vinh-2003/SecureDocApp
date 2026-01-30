import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaSearchPlus, FaSearchMinus,
    FaExpand, FaCompress, FaChevronLeft, FaChevronRight,
    FaList, FaColumns, FaUserCog, FaDownload
} from 'react-icons/fa';

/**
 * Toolbar cho FileViewer
 */
const ViewerToolbar = ({
    currentPage,
    totalPages,
    zoomLevel,
    showSidebar,
    isFullscreen,
    isOwner,
    canGoNext,
    canGoPrev,
    onPrevPage,
    onNextPage,
    onZoomIn,
    onZoomOut,
    onToggleSidebar,
    onToggleFullscreen,
    onDownload,
    onManageAccess
}) => {
    const navigate = useNavigate();

    return (
        <header className="h-14 bg-gray-800 border-b border-gray-700 shadow-md flex items-center justify-between px-4 shrink-0 text-white">
            {/* Left:  Back & Title */}
            <ToolbarLeft
                currentPage={currentPage}
                totalPages={totalPages}
                onBack={() => navigate(-1)}
            />

            {/* Center: Navigation & Zoom */}
            <ToolbarCenter
                currentPage={currentPage}
                totalPages={totalPages}
                zoomLevel={zoomLevel}
                canGoNext={canGoNext}
                canGoPrev={canGoPrev}
                onPrevPage={onPrevPage}
                onNextPage={onNextPage}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
            />

            {/* Right: View Options */}
            <ToolbarRight
                showSidebar={showSidebar}
                isFullscreen={isFullscreen}
                isOwner={isOwner}
                onToggleSidebar={onToggleSidebar}
                onToggleFullscreen={onToggleFullscreen}
                onDownload={onDownload}
                onManageAccess={onManageAccess}
            />
        </header>
    );
};

/**
 * Left section: Back button & title
 */
const ToolbarLeft = ({ currentPage, totalPages, onBack }) => (
    <div className="flex items-center gap-4">
        <button
            onClick={onBack}
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
                Trang {currentPage} / {totalPages}
            </span>
        </div>
    </div>
);

/**
 * Center section: Navigation & Zoom controls
 */
const ToolbarCenter = ({
    currentPage,
    totalPages,
    zoomLevel,
    canGoNext,
    canGoPrev,
    onPrevPage,
    onNextPage,
    onZoomIn,
    onZoomOut
}) => (
    <div className="hidden md:flex items-center bg-gray-700 rounded-lg p-1 gap-1 border border-gray-600">
        {/* Page Navigation */}
        <button
            onClick={onPrevPage}
            disabled={!canGoPrev}
            className="p-1.5 hover:bg-gray-600 rounded disabled:opacity-30 transition"
            title="Trang trước"
        >
            <FaChevronLeft size={12} />
        </button>

        <span className="text-xs font-mono w-16 text-center border-l border-r border-gray-600 px-2">
            {currentPage} / {totalPages}
        </span>

        <button
            onClick={onNextPage}
            disabled={!canGoNext}
            className="p-1.5 hover:bg-gray-600 rounded disabled:opacity-30 transition"
            title="Trang sau"
        >
            <FaChevronRight size={12} />
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-500 mx-1" />

        {/* Zoom Controls */}
        <button
            onClick={onZoomOut}
            className="p-1.5 hover:bg-gray-600 rounded transition"
            title="Thu nhỏ"
        >
            <FaSearchMinus size={12} />
        </button>

        <span className="text-xs font-bold w-12 text-center">
            {zoomLevel}%
        </span>

        <button
            onClick={onZoomIn}
            className="p-1.5 hover:bg-gray-600 rounded transition"
            title="Phóng to"
        >
            <FaSearchPlus size={12} />
        </button>
    </div>
);

/**
 * Right section:  View options
 */
const ToolbarRight = ({
    showSidebar,
    isFullscreen,
    isOwner,
    onToggleSidebar,
    onToggleFullscreen,
    onDownload,
    onManageAccess
}) => (
    <div className="flex items-center gap-2">
        {/* Download */}
        <ToolbarButton
            onClick={onDownload}
            icon={<FaDownload />}
            title="Tải file xuống"
        />

        {/* Toggle Sidebar */}
        <ToolbarButton
            onClick={onToggleSidebar}
            icon={showSidebar ? <FaColumns /> : <FaList />}
            title="Bật/Tắt Sidebar"
            active={showSidebar}
        />

        {/* Fullscreen */}
        <ToolbarButton
            onClick={onToggleFullscreen}
            icon={isFullscreen ? <FaCompress /> : <FaExpand />}
            title="Toàn màn hình"
        />

        {/* Manage Access (Owner only) */}
        {isOwner && (
            <button
                onClick={onManageAccess}
                className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded shadow transition"
            >
                <FaUserCog />
                <span className="hidden md:inline">Quản lý quyền</span>
            </button>
        )}
    </div>
);

/**
 * Single toolbar button
 */
const ToolbarButton = ({ onClick, icon, title, active = false }) => (
    <button
        onClick={onClick}
        className={`p-2 rounded transition ${active
                ? 'bg-gray-700 text-blue-400'
                : 'hover:bg-gray-700 text-gray-300 hover:text-white'
            }`}
        title={title}
    >
        {icon}
    </button>
);

export default ViewerToolbar;