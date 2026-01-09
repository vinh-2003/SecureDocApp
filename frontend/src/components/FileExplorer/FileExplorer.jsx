import React, { useRef } from 'react';
import { 
    FaList, FaThLarge, FaFolder, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, 
    FaFileImage, FaCheckSquare, FaSquare, FaEllipsisV, FaUserCircle 
} from 'react-icons/fa';
import { formatBytes, formatDate } from '../../utils/format';

// Tách icon helper ra dùng chung
export const getFileIcon = (type, extension, isLarge = false) => {
    const sizeClass = isLarge ? "text-5xl" : "text-2xl";
    if (type === 'FOLDER') return <FaFolder className={`text-yellow-500 ${sizeClass}`} />;
    const ext = extension?.toLowerCase();
    if (ext === 'pdf') return <FaFilePdf className={`text-red-500 ${sizeClass}`} />;
    if (['doc', 'docx'].includes(ext)) return <FaFileWord className={`text-blue-500 ${sizeClass}`} />;
    if (['xls', 'xlsx'].includes(ext)) return <FaFileExcel className={`text-green-600 ${sizeClass}`} />;
    if (['jpg', 'png', 'jpeg'].includes(ext)) return <FaFileImage className={`text-purple-500 ${sizeClass}`} />;
    return <FaFileAlt className={`text-gray-400 ${sizeClass}`} />;
};

const FileExplorer = ({ 
    files, 
    viewMode, 
    selectedItems, 
    onSelect, 
    onSelectAll, 
    onNavigate, 
    onContextMenu,
    onMenuAction,
    showOwner = false // Prop mới: Có hiện cột Owner không?
}) => {
    const clickTimeoutRef = useRef(null);

    // --- LOGIC CLICK THÔNG MINH (Tái sử dụng) ---
    const handleSmartClick = (e, file, index) => {
        // Nếu click vào checkbox hoặc nút 3 chấm -> Bỏ qua logic row click
        if (e.target.closest('.action-btn') || e.target.closest('.checkbox-area')) return;

        if (clickTimeoutRef.current) {
            // Double Click
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            onNavigate(file); // Gọi callback mở file
        } else {
            // Single Click (Wait 250ms)
            clickTimeoutRef.current = setTimeout(() => {
                // Xử lý logic chọn (Ctrl/Shift/Normal)
                let multi = e.ctrlKey || e.metaKey;
                let range = e.shiftKey;
                onSelect(file, index, multi, range);
                clickTimeoutRef.current = null;
            }, 250);
        }
    };

    if (files.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center text-gray-500">
                <p>Không có dữ liệu hiển thị.</p>
            </div>
        );
    }

    // --- RENDER LIST VIEW ---
    if (viewMode === 'list') {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-4 py-3 border-b w-10 text-center">
                                <button onClick={onSelectAll} className="text-gray-400 hover:text-blue-600 action-btn">
                                    {selectedItems.length > 0 && selectedItems.length === files.length 
                                        ? <FaCheckSquare className="text-blue-600 text-lg"/> 
                                        : <FaSquare className="text-lg"/>}
                                </button>
                            </th>
                            <th className="px-6 py-3 border-b">Tên</th>
                            {showOwner && <th className="px-6 py-3 border-b hidden sm:table-cell">Chủ sở hữu</th>}
                            <th className="px-6 py-3 border-b hidden md:table-cell">Ngày sửa đổi</th>
                            <th className="px-6 py-3 border-b text-right">#</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm">
                        {files.map((file, index) => {
                            const isSelected = selectedItems.some(f => f.id === file.id);
                            return (
                                <tr 
                                    key={file.id} 
                                    onClick={(e) => handleSmartClick(e, file, index)}
                                    onContextMenu={(e) => onContextMenu(e, file)}
                                    className={`transition border-b last:border-b-0 select-none cursor-pointer ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="px-4 py-4 text-center checkbox-area">
                                        <button onClick={(e) => { e.stopPropagation(); onSelect(file, index, true, false); }} className="text-gray-300 hover:text-blue-500 action-btn">
                                            {isSelected ? <FaCheckSquare className="text-blue-600 text-lg"/> : <FaSquare className="text-lg"/>}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        {getFileIcon(file.type, file.extension)}
                                        <span className="font-medium text-gray-900 truncate max-w-xs">{file.name}</span>
                                    </td>
                                    
                                    {showOwner && (
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className="flex items-center gap-2">
                                                {file.ownerAvatar ? <img src={file.ownerAvatar} className="w-6 h-6 rounded-full"/> : <FaUserCircle className="text-gray-300 w-6 h-6"/>}
                                                <span className="truncate max-w-[100px]">{file.ownerName || 'Unknown'}</span>
                                            </div>
                                        </td>
                                    )}

                                    <td className="px-6 py-4 hidden md:table-cell">{formatDate(file.updatedAt)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onMenuAction(e, file); }}
                                            className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 action-btn"
                                        >
                                            <FaEllipsisV />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    // --- RENDER GRID VIEW ---
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {files.map((file, index) => {
                const isSelected = selectedItems.some(f => f.id === file.id);
                return (
                    <div 
                        key={file.id} 
                        onClick={(e) => handleSmartClick(e, file, index)}
                        onContextMenu={(e) => onContextMenu(e, file)}
                        className={`p-4 rounded-lg border shadow-sm flex flex-col items-center text-center transition relative cursor-pointer select-none
                            ${isSelected ? 'bg-blue-50 border-blue-500 shadow-md' : 'bg-white border-gray-200 hover:shadow-md'}
                        `}
                    >
                        <div className={`absolute top-2 left-2 z-10 checkbox-area ${isSelected ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                            <button onClick={(e) => { e.stopPropagation(); onSelect(file, index, true, false); }} className="action-btn">
                                {isSelected ? <FaCheckSquare className="text-blue-600 text-lg bg-white rounded-sm"/> : <FaSquare className="text-gray-300 text-lg hover:text-gray-400"/>}
                            </button>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMenuAction(e, file); }}
                            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 opacity-0 hover:opacity-100 transition z-10 action-btn"
                        >
                            <FaEllipsisV />
                        </button>

                        <div className="mt-2 mb-3">{getFileIcon(file.type, file.extension, true)}</div>
                        <p className="text-sm font-medium text-gray-800 truncate w-full px-1">{file.name}</p>
                        
                        {showOwner && (
                            <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
                                <FaUserCircle className="text-gray-300 w-3 h-3"/>
                                <span className="truncate max-w-[80px]">{file.ownerName}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default FileExplorer;