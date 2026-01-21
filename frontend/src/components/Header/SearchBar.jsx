import React from 'react';
import { FaSearch, FaSlidersH } from 'react-icons/fa';

/**
 * Search input bar component
 */
const SearchBar = ({
    value,
    onChange,
    onKeyDown,
    onFocus,
    onAdvancedClick,
    placeholder = "Tìm kiếm tài liệu, thư mục..."
}) => {
    return (
        <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 border border-transparent focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm transition">
            <FaSearch className="text-gray-400 mr-3 flex-shrink-0" />

            <input
                type="text"
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-500 min-w-0"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
            />

            <button
                onClick={onAdvancedClick}
                className="ml-2 p-1. 5 rounded hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition flex-shrink-0"
                title="Tìm kiếm nâng cao"
                type="button"
            >
                <FaSlidersH />
            </button>
        </div>
    );
};

export default SearchBar;