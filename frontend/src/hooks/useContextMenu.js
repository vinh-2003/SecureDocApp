import { useState, useEffect, useCallback } from 'react';

/**
 * Hook quản lý trạng thái các loại Context Menu
 * 
 * @returns {Object} - Các state và handler cho context menu
 */
const useContextMenu = () => {
    // State cho Background Context Menu (Chuột phải vùng trống)
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0
    });

    // State cho Item Context Menu (Chuột phải hoặc 3 chấm vào file/folder)
    const [itemMenu, setItemMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        file: null
    });

    // State cho Breadcrumb Menu
    const [breadcrumbMenu, setBreadcrumbMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        file: null
    });

    // Đóng tất cả menu khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = () => {
            closeAllMenus();
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
        // eslint-disable-next-line
    }, []);

    // Đóng tất cả menu
    const closeAllMenus = useCallback(() => {
        setContextMenu(prev => ({ ...prev, visible: false }));
        setItemMenu(prev => ({ ...prev, visible: false }));
        setBreadcrumbMenu(prev => ({ ...prev, visible: false }));
    }, []);

    // Mở Background Context Menu (chuột phải vùng trống)
    const openContextMenu = useCallback((e) => {
        e.preventDefault();
        setItemMenu(prev => ({ ...prev, visible: false }));
        setBreadcrumbMenu(prev => ({ ...prev, visible: false }));
        setContextMenu({ visible: true, x: e.pageX, y: e.pageY });
    }, []);

    // Đóng Background Context Menu
    const closeContextMenu = useCallback(() => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    }, []);

    // Mở Item Context Menu (chuột phải vào file/folder)
    const openItemMenu = useCallback((e, file) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu(prev => ({ ...prev, visible: false }));
        setBreadcrumbMenu(prev => ({ ...prev, visible: false }));
        setItemMenu({ visible: true, x: e.pageX, y: e.pageY, file });
    }, []);

    // Mở Item Menu từ nút 3 chấm
    const openItemMenuFromButton = useCallback((e, file) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu(prev => ({ ...prev, visible: false }));
        setBreadcrumbMenu(prev => ({ ...prev, visible: false }));
        setItemMenu({
            visible: true,
            x: rect.left,
            y: rect.bottom,
            file
        });
    }, []);

    // Đóng Item Context Menu
    const closeItemMenu = useCallback(() => {
        setItemMenu(prev => ({ ...prev, visible: false }));
    }, []);

    // Mở Breadcrumb Menu (click mũi tên)
    const openBreadcrumbMenu = useCallback((e, item) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu(prev => ({ ...prev, visible: false }));
        setItemMenu(prev => ({ ...prev, visible: false }));
        setBreadcrumbMenu({
            visible: true,
            x: rect.left,
            y: rect.bottom + 5,
            file: { ...item, type: 'FOLDER' }
        });
    }, []);

    // Mở Breadcrumb Menu (chuột phải)
    const openBreadcrumbMenuFromContext = useCallback((e, item) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu(prev => ({ ...prev, visible: false }));
        setItemMenu(prev => ({ ...prev, visible: false }));
        setBreadcrumbMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            file: { ...item, type: 'FOLDER' }
        });
    }, []);

    // Đóng Breadcrumb Menu
    const closeBreadcrumbMenu = useCallback(() => {
        setBreadcrumbMenu(prev => ({ ...prev, visible: false }));
    }, []);

    return {
        // States
        contextMenu,
        itemMenu,
        breadcrumbMenu,

        // Background Menu handlers
        openContextMenu,
        closeContextMenu,

        // Item Menu handlers
        openItemMenu,
        openItemMenuFromButton,
        closeItemMenu,

        // Breadcrumb Menu handlers
        openBreadcrumbMenu,
        openBreadcrumbMenuFromContext,
        closeBreadcrumbMenu,

        // Utility
        closeAllMenus
    };
};

export default useContextMenu;