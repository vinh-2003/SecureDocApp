import { useState, useCallback } from 'react';

export const useFileSelection = (items) => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

    // 1. Chọn 1 item (hoặc bỏ chọn)
    const toggleSelection = useCallback((item, multiSelect = false) => {
        setSelectedItems(prev => {
            const isSelected = prev.some(i => i.id === item.id);
            if (multiSelect) {
                return isSelected ? prev.filter(i => i.id !== item.id) : [...prev, item];
            } else {
                return isSelected && prev.length === 1 ? [] : [item]; // Click lại thì bỏ chọn hoặc chọn duy nhất
            }
        });
    }, []);

    // 2. Chọn dải (Shift + Click)
    const selectRange = useCallback((index, itemsList) => {
        if (lastSelectedIndex === null) {
            setLastSelectedIndex(index);
            setSelectedItems([itemsList[index]]);
            return;
        }

        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const range = itemsList.slice(start, end + 1);
        setSelectedItems(range);
    }, [lastSelectedIndex]);

    // 3. Chọn tất cả
    const selectAll = useCallback(() => {
        setSelectedItems(prev => prev.length === items.length ? [] : [...items]);
    }, [items]);

    // 4. Reset
    const clearSelection = useCallback(() => setSelectedItems([]), []);

    return {
        selectedItems,
        setSelectedItems,
        lastSelectedIndex,
        setLastSelectedIndex,
        toggleSelection,
        selectRange,
        selectAll,
        clearSelection
    };
};