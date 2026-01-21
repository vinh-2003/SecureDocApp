import React from 'react';
import { FaLock, FaUnlock, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import SecureImageWithZoom from './SecureImageWithZoom';

/**
 * Main content area với page display
 * 
 * @param {Object} currentPage - Trang hiện tại
 * @param {number} currentPageIndex - Index trang hiện tại
 * @param {number} zoomLevel - Mức zoom
 * @param {boolean} canGoNext - Có thể chuyển trang tiếp
 * @param {boolean} canGoPrev - Có thể chuyển trang trước
 * @param {boolean} isOwner - Có phải chủ sở hữu không
 * @param {Function} onPrevPage - Handler trang trước
 * @param {Function} onNextPage - Handler trang sau
 * @param {Function} onToggleLock - Handler toggle lock
 * @param {Function} onRequestAccess - Handler request access
 */
const ViewerContent = ({
    currentPage,
    currentPageIndex,
    zoomLevel,
    canGoNext,
    canGoPrev,
    isOwner = false,
    onPrevPage,
    onNextPage,
    onToggleLock,
    onRequestAccess
}) => {
    if (!currentPage) return null;

    const isLocked = currentPage.locked && !currentPage.canViewClear;
    // Chỉ owner mới có quyền quản lý lock/unlock
    const canManageLock = isOwner && currentPage.canViewClear;

    return (
        <main className="flex-1 bg-gray-900 overflow-auto flex justify-center p-4 md:p-8 relative custom-scrollbar select-none">
            {/* Floating Navigation Buttons */}
            <NavigationButton
                direction="prev"
                disabled={!canGoPrev}
                onClick={onPrevPage}
            />
            <NavigationButton
                direction="next"
                disabled={!canGoNext}
                onClick={onNextPage}
            />

            {/* Page Container */}
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
                {/* Page Image with Zoom */}
                <SecureImageWithZoom
                    pageId={currentPage.id}
                    pageNumber={currentPageIndex + 1}
                    isLocked={isLocked}
                    className={`w-full min-h-[400px] ${isLocked ? 'filter blur-[5px] opacity-80' : ''}`}
                    alt={`Page ${currentPageIndex + 1}`}
                    showControls={!isLocked}
                    enableWheelZoom={!isLocked}
                    enableDrag={!isLocked}
                    enableKeyboard={!isLocked}
                />

                {/* Locked Overlay */}
                {isLocked && (
                    <LockedOverlay onRequestAccess={onRequestAccess} />
                )}

                {/* Owner Lock Toggle - Chỉ hiện cho owner */}
                {canManageLock && (
                    <LockToggleButton
                        isLocked={currentPage.locked}
                        onToggle={onToggleLock}
                    />
                )}
            </div>
        </main>
    );
};

/**
 * Floating navigation button
 */
const NavigationButton = ({ direction, disabled, onClick }) => {
    const isNext = direction === 'next';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                fixed top-1/2 -translate-y-1/2 z-30 p-3 
                bg-black/40 hover:bg-black/70 text-white rounded-full 
                transition disabled:hidden
                ${isNext ? 'right-4' : 'left-4'}
            `}
            title={isNext ? 'Trang sau' : 'Trang trước'}
        >
            {isNext ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
    );
};

/**
 * Locked page overlay
 */
const LockedOverlay = ({ onRequestAccess }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/10">
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-2xl text-center max-w-sm border border-gray-200 animate-fade-in-up">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <FaLock size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Trang bị giới hạn</h3>
            <p className="text-sm text-gray-500 mb-6 mt-2 leading-relaxed">
                Bạn cần yêu cầu quyền truy cập từ chủ sở hữu để xem nội dung trang này.
            </p>
            <button
                onClick={onRequestAccess}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-lg transition-transform active:scale-95"
            >
                Gửi yêu cầu mở khóa
            </button>
        </div>
    </div>
);

/**
 * Lock toggle button for owners only
 */
const LockToggleButton = ({ isLocked, onToggle }) => (
    <div className="absolute top-4 right-4 z-20 group">
        <button
            onClick={onToggle}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded shadow text-xs font-bold transition-all
                ${isLocked
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-100 text-gray-500 hover:text-blue-600 hover:bg-white opacity-0 group-hover:opacity-100'
                }
            `}
            title={isLocked ? 'Nhấn để mở khóa trang' : 'Nhấn để khóa trang'}
        >
            {isLocked ? (
                <>
                    <FaLock size={10} /> Đang khóa
                </>
            ) : (
                <>
                    <FaUnlock size={10} /> Khóa trang
                </>
            )}
        </button>
    </div>
);

export default ViewerContent;