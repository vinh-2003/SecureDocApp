import React from 'react';
import { SortSelect, ViewModeToggle } from '../Common';
import { ColumnToggle } from './index';

/**
 * Toolbar cho file explorer với sort, column toggle, view mode
 */
const FileToolbar = ({
    title,
    // Sort props
    showSort = true,
    sortValue,
    onSortChange,
    // Column Toggle props
    showColumnToggle = true,
    viewMode,
    visibleColumns,
    columnOptions,
    onColumnsChange,
    // View Mode props
    showViewMode = true,
    onViewModeChange,
    className = ''
}) => {
    return (
        <div className={`flex flex-col md:flex-row justify-between items-center mb-4 gap-4 ${className}`}>
            {title && (
                <h2 className="text-lg font-semibold text-gray-700 self-start md:self-center">
                    {title}
                </h2>
            )}

            <div className="flex items-center gap-3 self-end md:self-center">
                {showSort && (
                    <SortSelect
                        value={sortValue}
                        onChange={onSortChange}
                    />
                )}

                {showColumnToggle && viewMode === 'list' && (
                    <ColumnToggle
                        allColumns={columnOptions}
                        visibleColumns={visibleColumns}
                        onChange={onColumnsChange}
                    />
                )}

                {showViewMode && (
                    <ViewModeToggle
                        viewMode={viewMode}
                        onChange={onViewModeChange}
                    />
                )}
            </div>
        </div>
    );
};

export default FileToolbar;