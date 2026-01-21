import React from 'react';

/**
 * Component input khoảng ngày
 */
const DateRangeInput = ({
    fromDate,
    toDate,
    onFromChange,
    onToChange,
    fromLabel = 'Từ ngày',
    toLabel = 'Đến ngày'
}) => {
    return (
        <div className="grid grid-cols-2 gap-5">
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                    {fromLabel}
                </label>
                <input
                    type="date"
                    value={fromDate}
                    onChange={onFromChange}
                    className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                    {toLabel}
                </label>
                <input
                    type="date"
                    value={toDate}
                    onChange={onToChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                />
            </div>
        </div>
    );
};

export default DateRangeInput;