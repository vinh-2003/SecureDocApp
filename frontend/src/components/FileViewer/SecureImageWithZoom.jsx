import React, { useRef, useEffect } from 'react';
import { FaLock, FaEye } from 'react-icons/fa';

// Components
import ZoomControls from './ZoomControls';
import { Spinner } from '../Common/Loading';

// Hooks
import { useSecureImage, useImageZoom } from '../../hooks';

/**
 * =============================================================================
 * SECURE IMAGE WITH ZOOM
 * =============================================================================
 * Component hiển thị ảnh bảo mật với tính năng zoom
 * - Zoom qua controls (nút +/-)
 * - Zoom qua dropdown chọn mức
 * - Drag để pan khi đã zoom
 * =============================================================================
 */
const SecureImageWithZoom = ({
    pageId,
    isLocked = false,
    className = '',
    imageClassName = '',
    alt = 'Document page',
    showControls = true,
    enableDrag = true,
    enableKeyboard = true,
    onLoad,
    onError
}) => {
    const containerRef = useRef(null);

    // Image loading hook
    const { imageUrl, loading, error, refetch } = useSecureImage(pageId, {
        enabled: !isLocked
    });

    // Zoom hook
    const {
        zoom,
        position,
        isDragging,
        canZoomIn,
        canZoomOut,
        zoomPercentage,
        isZoomed,
        presetLevels,
        zoomIn,
        zoomOut,
        setZoomLevel,
        reset,
        handleDragStart,
        handleDragMove,
        handleDragEnd
    } = useImageZoom();

    // Keyboard shortcuts (chỉ +/- và 0, không cần Ctrl)
    useEffect(() => {
        if (!enableKeyboard) return;

        const handleKeyDown = (e) => {
            // Chỉ xử lý khi focus trong container
            if (!containerRef.current?.contains(document.activeElement)) return;

            // Không cần Ctrl, chỉ cần phím +/-/0
            if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                zoomIn();
            } else if (e.key === '-') {
                e.preventDefault();
                zoomOut();
            } else if (e.key === '0') {
                e.preventDefault();
                reset();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [enableKeyboard, zoomIn, zoomOut, reset]);

    // Error callback
    useEffect(() => {
        if (error) {
            onError?.(error);
        }
    }, [error, onError]);

    // Render states
    if (isLocked) {
        return <LockedPlaceholder className={className} />;
    }

    if (loading) {
        return <LoadingPlaceholder className={className} />;
    }

    if (error) {
        return <ErrorPlaceholder className={className} onRetry={refetch} />;
    }

    if (!imageUrl) {
        return <EmptyPlaceholder className={className} />;
    }

    return (
        <div
            ref={containerRef}
            className={`relative group overflow-hidden bg-gray-100 ${className}`}
            tabIndex={0}
            onMouseDown={enableDrag ? handleDragStart : undefined}
            onMouseMove={enableDrag ? handleDragMove : undefined}
            onMouseUp={enableDrag ? handleDragEnd : undefined}
            onMouseLeave={enableDrag ? handleDragEnd : undefined}
            style={{
                cursor: isDragging ? 'grabbing' : (isZoomed ? 'grab' : 'default')
            }}
        >
            {/* Image Container */}
            <div
                className="flex items-center justify-center min-h-[200px] transition-transform duration-150"
                style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                    transformOrigin: 'center center'
                }}
            >
                <img
                    src={imageUrl}
                    alt={alt}
                    className={`max-w-full select-none ${imageClassName}`}
                    draggable={false}
                    onLoad={onLoad}
                />
            </div>

            {/* Zoom Controls */}
            {showControls && (
                <ZoomControls
                    zoom={zoom}
                    zoomPercentage={zoomPercentage}
                    canZoomIn={canZoomIn}
                    canZoomOut={canZoomOut}
                    isZoomed={isZoomed}
                    presetLevels={presetLevels}
                    onZoomIn={zoomIn}
                    onZoomOut={zoomOut}
                    onReset={reset}
                    onSetZoom={setZoomLevel}
                />
            )}

            {/* Zoom indicator */}
            {isZoomed && (
                <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <FaEye className="inline mr-1" size={10} />
                    {zoomPercentage}%
                </div>
            )}
        </div>
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const LockedPlaceholder = ({ className }) => (
    <div className={`relative flex flex-col items-center justify-center bg-gray-200 ${className}`}>
        <div className="text-center p-8">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLock className="text-gray-500" size={24} />
            </div>
            <p className="text-gray-600 font-medium">Trang bị khóa</p>
            <p className="text-gray-400 text-sm mt-1">Bạn cần yêu cầu quyền truy cập</p>
        </div>
    </div>
);

const LoadingPlaceholder = ({ className }) => (
    <div className={`relative flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
            <Spinner size="lg" color="blue" />
            <p className="text-gray-500 text-sm mt-3">Đang tải trang...</p>
        </div>
    </div>
);

const ErrorPlaceholder = ({ className, onRetry }) => (
    <div className={`relative flex flex-col items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl">! </span>
            </div>
            <p className="text-gray-600 font-medium">Không thể tải trang</p>
            <button
                onClick={onRetry}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
            >
                Thử lại
            </button>
        </div>
    </div>
);

const EmptyPlaceholder = ({ className }) => (
    <div className={`relative flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        <div className="text-center">
            <span className="text-4xl">📄</span>
            <p className="text-sm mt-2">Không có nội dung</p>
        </div>
    </div>
);

export default SecureImageWithZoom;