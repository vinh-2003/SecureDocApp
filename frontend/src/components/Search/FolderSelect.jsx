import React from 'react';

/**
 * Select dropdown cho folders với tree structure
 */
const FolderSelect = ({
    value,
    onChange,
    options = [],
    loading = false,
    disabled = false,
    placeholder = '-- Tất cả (Gốc) --',
    label = 'Trong thư mục',
    name = 'locationId'
}) => {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
                {label}
            </label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                disabled={loading || disabled}
                className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
                <option value="">{placeholder}</option>
                {!loading && options.map(folder => (
                    <option key={folder.id} value={folder.id}>
                        {/* Sử dụng non-breaking spaces để tạo indent */}
                        {'\u00A0'.repeat(folder.level * 4)}
                        {folder.level > 0 ? '└─ ' : ''}
                        {folder.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default FolderSelect;