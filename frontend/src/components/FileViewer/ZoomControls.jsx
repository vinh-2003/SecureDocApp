import React, { useState, useRef, useEffect } from 'react';
import {
    FaSearchPlus,
    FaSearchMinus,
    FaCompress,
    FaChevronDown
} from 'react-icons/fa';

/**
 * Controls cho zoom ảnh
 */
const ZoomControls = ({
    zoom,
    zoomPercentage,
    canZoomIn,
    canZoomOut,
    isZoomed,
    presetLevels = [],
    onZoomIn,
    onZoomOut,
    onReset,
    onSetZoom
}) => {
    const [showPresets, setShowPresets] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        if (!showPresets) return;

        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowPresets(false);
            }
        };

        // Delay để tránh đóng ngay khi vừa mở
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 10);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPresets]);

    const handlePresetSelect = (value) => {
        onSetZoom(value);
        setShowPresets(false);
    };

    return (
        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-1. 5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {/* Zoom Out */}
            <button
                type="button"
                onClick={onZoomOut}
                disabled={!canZoomOut}
                className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Thu nhỏ (-)"
            >
                <FaSearchMinus size={14} />
            </button>

            {/* Zoom Level Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded text-sm font-medium min-w-[65px] justify-center transition"
                    title="Chọn mức zoom"
                >
                    {zoomPercentage}%
                    <FaChevronDown
                        size={10}
                        className={`text-gray-400 transition-transform duration-200 ${showPresets ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Preset Dropdown */}
                {showPresets && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[90px] z-50">
                        {presetLevels.map((preset) => (
                            <button
                                key={preset.value}
                                type="button"
                                onClick={() => handlePresetSelect(preset.value)}
                                className={`
                                    w-full px-3 py-2 text-sm text-left hover: bg-blue-50 transition
                                    ${zoom === preset.value
                                        ? 'bg-blue-50 text-blue-600 font-medium'
                                        : 'text-gray-700'
                                    }
                                `}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Zoom In */}
            <button
                type="button"
                onClick={onZoomIn}
                disabled={!canZoomIn}
                className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Phóng to (+)"
            >
                <FaSearchPlus size={14} />
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-gray-300 mx-1" />

            {/* Reset */}
            <button
                type="button"
                onClick={onReset}
                disabled={!isZoomed}
                className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Về kích thước gốc (0)"
            >
                <FaCompress size={14} />
            </button>
        </div>
    );
};

export default ZoomControls;