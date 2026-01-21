import { useState, useLayoutEffect, useCallback } from 'react';

/**
 * =============================================================================
 * USE MENU POSITION HOOK
 * =============================================================================
 * Hook tính toán vị trí tối ưu cho context menu, đảm bảo không bị tràn viewport
 * 
 * @param {React.RefObject} ref - Ref của menu element
 * @param {number} x - Tọa độ X click
 * @param {number} y - Tọa độ Y click
 * @param {boolean} visible - Menu có đang hiển thị không
 * @param {Object} options - Các tùy chọn bổ sung
 * @returns {Object} { top, left } - Vị trí đã tính toán
 * =============================================================================
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_OPTIONS = {
    padding: 10,           // Khoảng cách tối thiểu từ mép màn hình
    offsetX: 0,            // Offset thêm theo trục X
    offsetY: 0,            // Offset thêm theo trục Y
    preferredPosition: 'bottom-right' // Vị trí ưu tiên:  'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
};

// Vị trí ẩn menu khi chưa tính toán xong
const HIDDEN_POSITION = { top: -9999, left: -9999 };

// =============================================================================
// HOOK
// =============================================================================

const useMenuPosition = (ref, x, y, visible, options = {}) => {
    const [position, setPosition] = useState(HIDDEN_POSITION);

    const {
        padding,
        offsetX,
        offsetY,
        preferredPosition
    } = { ...DEFAULT_OPTIONS, ...options };

    /**
     * Tính toán vị trí tối ưu cho menu
     */
    const calculatePosition = useCallback(() => {
        if (!ref?.current) {
            return HIDDEN_POSITION;
        }

        const menuRect = ref.current.getBoundingClientRect();
        const { innerWidth: viewportWidth, innerHeight: viewportHeight } = window;

        const menuWidth = menuRect.width;
        const menuHeight = menuRect.height;

        // Tính toán vị trí ban đầu với offset
        let newLeft = x + offsetX;
        let newTop = y + offsetY;

        // Kiểm tra không gian có sẵn ở mỗi hướng
        const spaceRight = viewportWidth - x;
        const spaceLeft = x;
        const spaceBottom = viewportHeight - y;
        const spaceTop = y;

        // Xử lý tràn theo chiều ngang
        if (preferredPosition.includes('right')) {
            // Ưu tiên bên phải
            if (spaceRight < menuWidth + padding) {
                // Không đủ chỗ bên phải -> Chuyển sang trái
                newLeft = x - menuWidth;
            }
        } else {
            // Ưu tiên bên trái
            if (spaceLeft < menuWidth + padding) {
                // Không đủ chỗ bên trái -> Giữ bên phải
                newLeft = x;
            } else {
                newLeft = x - menuWidth;
            }
        }

        // Xử lý tràn theo chiều dọc
        if (preferredPosition.includes('bottom')) {
            // Ưu tiên bên dưới
            if (spaceBottom < menuHeight + padding) {
                // Không đủ chỗ bên dưới -> Chuyển lên trên
                newTop = y - menuHeight;
            }
        } else {
            // Ưu tiên bên trên
            if (spaceTop < menuHeight + padding) {
                // Không đủ chỗ bên trên -> Giữ bên dưới
                newTop = y;
            } else {
                newTop = y - menuHeight;
            }
        }

        // Safety bounds:  Đảm bảo không ra ngoài viewport
        newLeft = Math.max(padding, Math.min(newLeft, viewportWidth - menuWidth - padding));
        newTop = Math.max(padding, Math.min(newTop, viewportHeight - menuHeight - padding));

        return { top: newTop, left: newLeft };
    }, [ref, x, y, offsetX, offsetY, padding, preferredPosition]);

    // Tính toán vị trí khi dependencies thay đổi
    useLayoutEffect(() => {
        if (!visible) {
            setPosition(HIDDEN_POSITION);
            return;
        }

        // Delay nhỏ để đảm bảo menu đã render
        const timeoutId = requestAnimationFrame(() => {
            const newPosition = calculatePosition();
            setPosition(newPosition);
        });

        return () => {
            cancelAnimationFrame(timeoutId);
        };
    }, [visible, calculatePosition]);

    // Xử lý resize window
    useLayoutEffect(() => {
        if (!visible) return;

        const handleResize = () => {
            const newPosition = calculatePosition();
            setPosition(newPosition);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [visible, calculatePosition]);

    return position;
};

// =============================================================================
// HELPER HOOK:  useMenuPositionWithAnimation
// =============================================================================

/**
 * Hook mở rộng với hỗ trợ animation
 * @param {React. RefObject} ref
 * @param {number} x
 * @param {number} y
 * @param {boolean} visible
 * @param {Object} options
 * @returns {Object} { top, left, isPositioned }
 */
export const useMenuPositionWithAnimation = (ref, x, y, visible, options = {}) => {
    const [isPositioned, setIsPositioned] = useState(false);
    const position = useMenuPosition(ref, x, y, visible, options);

    useLayoutEffect(() => {
        if (visible && position.top !== -9999) {
            // Delay nhỏ để trigger animation
            const timeoutId = setTimeout(() => {
                setIsPositioned(true);
            }, 10);
            return () => clearTimeout(timeoutId);
        } else {
            setIsPositioned(false);
        }
    }, [visible, position]);

    return { ...position, isPositioned };
};

export default useMenuPosition;