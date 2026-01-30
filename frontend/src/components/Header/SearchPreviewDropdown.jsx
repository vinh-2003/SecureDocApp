import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    FaFolder, FaFileAlt, FaFilePdf, FaFileWord, FaFileImage,
    FaFileExcel, FaFilePowerpoint, FaFileVideo, FaFileAudio, FaFileArchive, FaFileCode
} from 'react-icons/fa';
import { formatDateShort } from '../../utils/format';
import { Spinner } from '../Common/Loading';
import fileService from '../../services/fileService';

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
    const handleItemClick = async (item) => {
        onResultClick?.();

        // 1. Folder
        if (item.type === 'FOLDER') {
            navigate(`/folders/${item.id}`);
            return;
        }

        const mime = item.mimeType || '';
        const name = item.name?.toLowerCase() || '';

        // 2. File xem trong ứng dụng (PDF, Word)
        const isInternalViewable = 
            mime === 'application/pdf' ||
            name.endsWith('.docx') ||
            name.endsWith('.doc');

        if (isInternalViewable) {
            navigate(`/file/view/${item.id}`);
            return;
        }

        // 3. File xem nhanh trên trình duyệt (Ảnh, Video, Text)
        const isBrowserPreviewable = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm',
            'text/plain'
        ].includes(mime);

        if (isBrowserPreviewable) {
            const toastId = toast.loading(`Đang mở: ${item.name}...`);
            try {
                const response = await fileService.previewFile(item.id);
                
                const fileType = response.type || mime;
                const blob = new Blob([response], { type: fileType });
                const url = window.URL.createObjectURL(blob);

                window.open(url, '_blank');
                setTimeout(() => window.URL.revokeObjectURL(url), 60000);
                
                toast.dismiss(toastId);
            } catch (error) {
                toast.dismiss(toastId);
                toast.error("Không thể xem trước file này.");
            }
            return;
        }

        // 4. Các file còn lại -> Tải xuống
        try {
            const toastId = toast.loading("Đang chuẩn bị tải xuống...");
            const response = await fileService.downloadFile(item.id);
            
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', item.name);
            document.body.appendChild(link);
            link.click();
            
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.dismiss(toastId);
        } catch (error) {
            toast.dismiss();
            toast.error("Lỗi khi tải file.");
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
                // Thay đổi items-center -> items-start để căn lề trên cùng nếu nội dung dài
                className="flex items-start justify-between px-4 py-3 hover:bg-blue-50 transition cursor-pointer group"
            >
                {/* Left: Icon + Info */}
                <div className="flex items-start gap-3 overflow-hidden flex-1 min-w-0">
                    {/* Icon Container (thêm mt-1 để căn đều với dòng đầu tiên) */}
                    <div className="mt-0.5 flex-shrink-0">
                        <FileIcon type={item.type} extension={item.extension} />
                    </div>

                    <div className="overflow-hidden flex flex-col min-w-0 w-full">
                        {/* Tên file */}
                        <p
                            className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-700"
                            title={item.name}
                        >
                            {item.name}
                        </p>
                        
                        {/* Người sở hữu */}
                        <p className="text-xs text-gray-500 truncate mb-0.5">
                            <span className="opacity-75">Bởi: </span>
                            <span className="font-medium text-gray-600">
                                {item.ownerName || item.owner?.name || "Ẩn danh"}
                            </span>
                        </p>

                        {/* [NEW] Highlight Content Section */}
                        {item.highlightedContent && (
                            <div className="mt-1 text-xs text-gray-500 font-normal bg-yellow-50/60 p-1.5 rounded border border-yellow-100/50">
                                <span 
                                    className="line-clamp-2 break-words search-highlight-content"
                                    // Render HTML từ backend trả về (<mark>...</mark>)
                                    dangerouslySetInnerHTML={{ __html: item.highlightedContent }} 
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Date */}
                <div className="ml-4 whitespace-nowrap text-right flex-shrink-0 mt-0.5">
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
    const iconClass = "text-xl flex-shrink-0"; // Class chung

    // 1. Folder
    if (type === 'FOLDER') {
        return <FaFolder className={`${iconClass} text-yellow-500`} />;
    }

    // 2. Office
    if (ext === 'pdf') {
        return <FaFilePdf className={`${iconClass} text-red-500`} />;
    }
    if (['doc', 'docx'].includes(ext)) {
        return <FaFileWord className={`${iconClass} text-blue-600`} />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return <FaFileExcel className={`${iconClass} text-green-600`} />;
    }
    if (['ppt', 'pptx'].includes(ext)) {
        return <FaFilePowerpoint className={`${iconClass} text-orange-500`} />;
    }

    // 3. Media
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
        return <FaFileImage className={`${iconClass} text-purple-500`} />;
    }
    if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
        return <FaFileVideo className={`${iconClass} text-pink-500`} />;
    }
    if (['mp3', 'wav', 'ogg'].includes(ext)) {
        return <FaFileAudio className={`${iconClass} text-yellow-500`} />;
    }

    // 4. Other
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return <FaFileArchive className={`${iconClass} text-gray-600`} />;
    }
    if (['html', 'css', 'js', 'json', 'java', 'py'].includes(ext)) {
        return <FaFileCode className={`${iconClass} text-gray-700`} />;
    }

    // Default
    return <FaFileAlt className={`${iconClass} text-gray-400`} />;
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