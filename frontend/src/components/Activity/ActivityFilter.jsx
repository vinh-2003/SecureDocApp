import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaFilter, FaTimes, FaChevronDown } from 'react-icons/fa';
import { ACTIVITY_GROUPS, ACTIVITY_TYPES } from '../../constants';
import { useMenuPosition } from '../../hooks';

const ActivityFilter = ({ filters, onFilterChange, onClear }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState('all');
    const buttonRef = useRef(null);
    const panelRef = useRef(null);

    // Để lưu vị trí nút
    const [anchor, setAnchor] = useState({ x: 0, y: 0 });

    // Khi mở, lấy vị trí button
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setAnchor({
                x: rect.left,
                y: rect.bottom
            });
        }
    }, [isOpen]);

    // Tính vị trí panel sao cho không bị tràn màn hình
    const panelPosition = useMenuPosition(
        panelRef,
        anchor.x,
        anchor.y,
        isOpen,
        {
            padding: 12,
            offsetX: 0,
            offsetY: 6,
            preferredPosition: 'bottom-right'
        }
    );

    const hasActiveFilters = filters.actionTypes?.length > 0 ||
        filters.actorId ||
        filters.fromDate ||
        filters.toDate;

    const handleGroupChange = (groupKey) => {
        setSelectedGroup(groupKey);
        const group = ACTIVITY_GROUPS[groupKey];
        onFilterChange({ actionTypes: group.types || [] });
    };

    const handleTypeToggle = (typeKey) => {
        const current = filters.actionTypes || [];
        const updated = current.includes(typeKey)
            ? current.filter(t => t !== typeKey)
            : [...current, typeKey];
        onFilterChange({ actionTypes: updated });
        setSelectedGroup('custom');
    };

    const handleClearAll = () => {
        setSelectedGroup('all');
        onClear();
    };

    // Portal utility, render dropdown lên body
    const Portal = ({ children }) =>
        typeof document !== 'undefined'
            ? ReactDOM.createPortal(children, document.body)
            : null;

    return (
        <div className="inline-block">
            {/* Toggle Button */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition
                    ${hasActiveFilters
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                `}
                type="button"
            >
                <FaFilter size={12} />
                <span>Bộ lọc</span>
                {hasActiveFilters && (
                    <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {filters.actionTypes?.length || '•'}
                    </span>
                )}
                <FaChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && typeof document !== 'undefined' && (
                <Portal>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[1000]"
                        onClick={() => setIsOpen(false)}
                    />
                    {/* Panel với vị trí tính toán */}
                    <div
                        ref={panelRef}
                        className="fixed z-[1010] w-80 bg-white rounded-xl shadow-xl border overflow-hidden"
                        style={{
                            left: panelPosition.left,
                            top: panelPosition.top,
                            maxWidth: '95vw'
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                            <span className="font-medium text-gray-800">Lọc hoạt động</span>
                            {hasActiveFilters && (
                                <button
                                    onClick={handleClearAll}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    <FaTimes size={10} />
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                        {/* Quick Groups */}
                        <div className="p-3 border-b">
                            <p className="text-xs text-gray-500 mb-2 font-medium">Lọc nhanh</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(ACTIVITY_GROUPS).map(([key, group]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleGroupChange(key)}
                                        className={`
                                            px-3 py-1.5 rounded-full text-xs font-medium transition
                                            ${selectedGroup === key
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }
                                        `}
                                    >
                                        {group.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Individual Types */}
                        <div className="p-3 max-h-60 overflow-y-auto">
                            <p className="text-xs text-gray-500 mb-2 font-medium">Loại hoạt động</p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(ACTIVITY_TYPES).map(([key, type]) => {
                                    const isSelected = filters.actionTypes?.includes(key);
                                    return (
                                        <label
                                            key={key}
                                            className={`
                                                flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition
                                                ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                                            `}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleTypeToggle(key)}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className={`
                                                text-xs px-1.5 py-0.5 rounded
                                                ${type.bgColor} ${type.textColor}
                                            `}>
                                                {type.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="px-4 py-3 border-t bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                            >
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
};

export default ActivityFilter;