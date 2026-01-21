import React from 'react';
import { FaLock } from 'react-icons/fa';
import SecureImage from './SecureImage';

/**
 * Sidebar với thumbnails
 */
const ViewerSidebar = ({
    pages = [],
    currentPageIndex,
    onPageClick,
    isVisible = true
}) => {
    if (!isVisible) return null;

    return (
        <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col gap-3 p-3 overflow-y-auto custom-scrollbar shrink-0 transition-all duration-300">
            {pages.map((page, index) => (
                <ThumbnailItem
                    key={page.id}
                    page={page}
                    index={index}
                    isActive={index === currentPageIndex}
                    onClick={() => onPageClick(index)}
                />
            ))}
        </aside>
    );
};

/**
 * Single thumbnail item
 */
const ThumbnailItem = ({ page, index, isActive, onClick }) => {
    const isLocked = page.locked && !page.canViewClear;

    return (
        <div
            id={`thumb-${index}`}
            onClick={onClick}
            className={`
                relative cursor-pointer group rounded overflow-hidden border-2 
                transition-all shrink-0
                ${isActive
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-transparent hover:border-gray-500'
                }
            `}
        >
            {/* Thumbnail Image */}
            <SecureImage
                pageId={page.id}
                className="w-full h-auto object-contain bg-white min-h-[80px]"
                alt={`Thumbnail ${index + 1}`}
            />

            {/* Page Number Badge */}
            <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-tl font-mono">
                {index + 1}
            </div>

            {/* Lock Overlay */}
            {page.locked && (
                <div className={`
                    absolute inset-0 flex items-center justify-center bg-black/20
                    ${isLocked ? 'backdrop-blur-[1px]' : ''}
                `}>
                    <div className="bg-yellow-500 text-white p-1 rounded-full shadow-sm">
                        <FaLock size={10} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewerSidebar;