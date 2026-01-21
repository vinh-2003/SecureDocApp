import React from 'react';
import { FaList, FaThLarge } from 'react-icons/fa';

/**
 * Component toggle giữa chế độ xem List và Grid
 * 
 * @param {string} viewMode - Chế độ xem hiện tại ('list' | 'grid')
 * @param {Function} onChange - Callback khi thay đổi chế độ xem
 * @param {string} className - Class bổ sung
 */
const ViewModeToggle = ({
    viewMode = 'list',
    onChange,
    className = ''
}) => {
    return (
        <div className={`flex bg-gray-100 p-1 rounded-lg border border-gray-200 ${className}`}>
            <button
                onClick={() => onChange?.('list')}
                className={`p-1.5 rounded transition ${viewMode === 'list'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                title="Danh sách"
            >
                <FaList size={16} />
            </button>
            <button
                onClick={() => onChange?.('grid')}
                className={`p-1.5 rounded transition ${viewMode === 'grid'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                title="Lưới"
            >
                <FaThLarge size={16} />
            </button>
        </div>
    );
};

export default ViewModeToggle;