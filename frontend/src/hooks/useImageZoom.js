import { useState, useCallback, useMemo } from 'react';

/**
 * Hook quản lý zoom và pan cho ảnh
 */
const useImageZoom = (options = {}) => {
    const {
        minZoom = 0.5,
        maxZoom = 3,
        zoomStep = 0.25,
        initialZoom = 1
    } = options;

    const [zoom, setZoom] = useState(initialZoom);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Zoom in
    const zoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + zoomStep, maxZoom));
    }, [zoomStep, maxZoom]);

    // Zoom out
    const zoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - zoomStep, minZoom));
    }, [zoomStep, minZoom]);

    // Set zoom trực tiếp
    const setZoomLevel = useCallback((level) => {
        const clampedLevel = Math.max(minZoom, Math.min(level, maxZoom));
        setZoom(clampedLevel);
    }, [minZoom, maxZoom]);

    // Reset về mặc định
    const reset = useCallback(() => {
        setZoom(initialZoom);
        setPosition({ x: 0, y: 0 });
    }, [initialZoom]);

    // Handle drag start
    const handleDragStart = useCallback((e) => {
        if (zoom <= 1) return;

        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    }, [zoom, position]);

    // Handle drag move
    const handleDragMove = useCallback((e) => {
        if (!isDragging) return;

        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    // Handle drag end
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Computed values
    const canZoomIn = zoom < maxZoom;
    const canZoomOut = zoom > minZoom;
    const zoomPercentage = Math.round(zoom * 100);
    const isZoomed = zoom !== 1;

    // Preset zoom levels
    const presetLevels = useMemo(() => [
        { value: 0.5, label: '50%' },
        { value: 0.75, label: '75%' },
        { value: 1, label: '100%' },
        { value: 1.5, label: '150%' },
        { value: 2, label: '200%' },
        { value: 3, label: '300%' }
    ], []);

    return {
        // State
        zoom,
        position,
        isDragging,

        // Computed
        canZoomIn,
        canZoomOut,
        zoomPercentage,
        isZoomed,
        presetLevels,

        // Actions
        zoomIn,
        zoomOut,
        setZoomLevel,
        reset,

        // Event handlers
        handleDragStart,
        handleDragMove,
        handleDragEnd
    };
};

export default useImageZoom;