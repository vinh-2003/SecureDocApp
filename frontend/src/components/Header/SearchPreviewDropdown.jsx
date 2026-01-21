import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFolder, FaFileAlt, FaFilePdf, FaFileWord, FaFileImage } from 'react-icons/fa';
import { formatDateShort } from '../../utils/format';
import { Spinner } from '../Common/Loading';

/**
 * Dropdown hiển thị kết quả search preview
 */
const SearchPreviewDropdown = ({
    results = [],
    isLoading = false,
    keyword = '',
    onResultClick,
    onViewAll
}) => {
    const navigate = useNavigate();

    // Handle click vào item
    const handleItemClick = (item) => {
        onResultClick?.();

        if (item.type === 'FOLDER') {
            navigate(`/folders/${item.id}`);
        } else {
            navigate(`/file/view/${item.id}`);
        }
    };

    // Handle view all
    const handleViewAll = () => {
        onViewAll?.();
    };

    return (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in-down">
            {isLoading ? (
                <LoadingState />
            ) : results.length > 0 ? (
                <>
                    <ResultsList
                        results={results}
                        onItemClick={handleItemClick}
                    />
                    <ViewAllFooter
                        keyword={keyword}
                        onClick={handleViewAll}
                    />
                </>
            ) : (
                <EmptyState />
            )}
        </div>
    );
};

/**
 * Loading state
 */
const LoadingState = () => (
    <div className="p-4 text-center text-sm text-gray-500 flex justify-center items-center gap-2">
        <Spinner size="sm" color="blue" />
        <span>Đang tìm... </span>
    </div>
);

/**
 * Empty state
 */
const EmptyState = () => (
    <div className="p-4 text-center text-sm text-gray-500">
        Không tìm thấy kết quả.
    </div>
);

/**
 * Results list
 */
const ResultsList = ({ results, onItemClick }) => (
    <ul>
        {results.map(item => (
            <ResultItem
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
            />
        ))}
    </ul>
);

/**
 * Single result item
 */
const ResultItem = ({ item, onClick }) => {
    return (
        <li className="border-b last:border-none">
            <div
                onClick={onClick}
                className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition cursor-pointer group"
            >
                {/* Left:  Icon + Name + Owner */}
                <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                    <FileIcon type={item.type} extension={item.extension} />

                    <div className="overflow-hidden flex flex-col min-w-0">
                        <p
                            className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-700"
                            title={item.name}
                        >
                            {item.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            <span className="opacity-75">Bởi: </span>
                            <span className="font-medium text-gray-600">
                                {item.ownerName || item.owner?.name || "Ẩn danh"}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Right:  Date */}
                <div className="ml-4 whitespace-nowrap text-right flex-shrink-0">
                    <p className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                        {formatDateShort(item.updatedAt)}
                    </p>
                </div>
            </div>
        </li>
    );
};

/**
 * File/Folder icon helper
 */
const FileIcon = ({ type, extension }) => {
    const ext = extension?.toLowerCase() || '';

    if (type === 'FOLDER') {
        return <FaFolder className="text-xl text-yellow-500 flex-shrink-0" />;
    }

    if (ext === 'pdf') {
        return <FaFilePdf className="text-xl text-red-500 flex-shrink-0" />;
    }

    if (['doc', 'docx'].includes(ext)) {
        return <FaFileWord className="text-xl text-blue-500 flex-shrink-0" />;
    }

    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
        return <FaFileImage className="text-xl text-purple-500 flex-shrink-0" />;
    }

    return <FaFileAlt className="text-xl text-gray-400 flex-shrink-0" />;
};

/**
 * View all footer
 */
const ViewAllFooter = ({ keyword, onClick }) => (
    <div
        onClick={onClick}
        className="bg-gray-50 px-4 py-3 text-center text-sm text-blue-600 font-semibold cursor-pointer hover:bg-gray-100 border-t transition hover:underline"
    >
        Xem tất cả kết quả cho "{keyword}"
    </div>
);

export default SearchPreviewDropdown;