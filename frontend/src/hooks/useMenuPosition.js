// src/hooks/useMenuPosition.js
import { useState, useLayoutEffect } from 'react';

export const useMenuPosition = (ref, x, y, visible) => {
    const [position, setPosition] = useState({ top: -9999, left: -9999 });

    useLayoutEffect(() => {
        if (!visible || !ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const { innerWidth, innerHeight } = window;

        let newTop = y;
        let newLeft = x;

        // 1. Xử lý tràn cạnh dưới (Bottom)
        // Nếu vị trí click + chiều cao menu > chiều cao màn hình -> Đẩy menu lên trên con trỏ
        if (y + rect.height > innerHeight) {
            newTop = y - rect.height;
        }

        // 2. Xử lý tràn cạnh phải (Right)
        // Nếu vị trí click + chiều rộng menu > chiều rộng màn hình -> Đẩy menu sang trái con trỏ
        if (x + rect.width > innerWidth) {
            newLeft = x - rect.width;
        }

        // 3. Safety Check: Đừng để menu bị đẩy ra ngoài mép trên hoặc trái
        if (newTop < 0) newTop = 10; // Cách mép trên 10px
        if (newLeft < 0) newLeft = 10; // Cách mép trái 10px

        setPosition({ top: newTop, left: newLeft });
        // eslint-disable-next-line
    }, [x, y, visible]); // Chạy lại khi tọa độ hoặc trạng thái visible thay đổi

    return position;
};