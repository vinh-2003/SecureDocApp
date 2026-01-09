// src/pages/TrashPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import fileService from '../services/fileService';
import { toast } from 'react-toastify';
import { 
    FaTrashRestore, FaBan, FaTrash, FaFolder, FaFileAlt, 
    FaFilePdf, FaFileWord, FaFileImage, FaList, FaThLarge, 
    FaCheckSquare, FaSquare, FaHome, FaChevronRight 
} from 'react-icons/fa';
import Loading from '../components/Loading';
import ConfirmModal from '../components/Common/ConfirmModal'; // Tận dụng Modal đã làm
import { formatBytes, formatDate } from '../utils/format'; // Hàm tiện ích có sẵn của bạn

const TrashPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Lấy parentId từ URL query (?parentId=...) để duyệt thư mục con trong thùng rác
    const currentFolderId = searchParams.get('parentId');

    // STATE
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    
    // Breadcrumbs giả lập (Vì thùng rác thường cấu trúc phẳng hoặc cây đơn giản)
    // Nếu muốn phức tạp, bạn cần API trả về breadcrumb của trash item
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Thùng rác' }]);

    // Modal State
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Click logic (Smart Click giống Dashboard)
    const clickTimeoutRef = useRef(null);

    // --- FETCH DATA ---
    useEffect(() => {
        fetchTrashFiles();
        setSelectedFiles([]); // Reset selection khi đổi folder
        // eslint-disable-next-line
    }, [currentFolderId]);

    const fetchTrashFiles = async () => {
        setLoading(true);
        try {
            const res = await fileService.getTrashFiles(currentFolderId);
            if (res.success) {
                setFiles(res.data);
                
                // Cập nhật Breadcrumb đơn giản (nếu đang ở sub-folder)
                if (currentFolderId) {
                    // Lưu ý: Để hiện tên folder cha chính xác, API getTrash nên trả về info folder cha
                    // Tạm thời hiển thị generic
                    setBreadcrumbs([
                        { id: null, name: 'Thùng rác' },
                        { id: currentFolderId, name: 'Thư mục con' } 
                    ]);
                } else {
                    setBreadcrumbs([{ id: null, name: 'Thùng rác' }]);
                }
            }
        } catch (error) {
            toast.error("Không thể tải thùng rác.");
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS: CHỌN FILE ---
    const handleSelectFile = (e, file) => {
        e.stopPropagation();
        const isSelected = selectedFiles.some(f => f.id === file.id);
        if (isSelected) {
            setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
        } else {
            setSelectedFiles(prev => [...prev, file]);
        }
    };

    const handleSelectAll = () => {
        if (selectedFiles.length === files.length) setSelectedFiles([]);
        else setSelectedFiles([...files]);
    };

    const handleRowClick = (e, file) => {
        if (e.target.closest('button') || e.target.closest('.checkbox-area')) return;
        
        if (e.ctrlKey || e.metaKey) {
            handleSelectFile(e, file);
        } else {
            setSelectedFiles([file]);
        }
    };

    const handleSmartClick = (e, file) => {
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            return;
        }
        clickTimeoutRef.current = setTimeout(() => {
            handleRowClick(e, file);
            clickTimeoutRef.current = null;
        }, 200);
    };

    const handleDoubleClick = (file) => {
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
        
        if (file.type === 'FOLDER') {
            // Điều hướng vào trong folder rác
            setSearchParams({ parentId: file.id });
        }
    };

    // --- HANDLERS: HÀNH ĐỘNG (RESTORE & DELETE) ---

    // 1. Khôi phục
    const handleRestore = async () => {
        if (selectedFiles.length === 0) return;
        
        setActionLoading(true);
        try {
            const ids = selectedFiles.map(f => f.id);
            const res = await fileService.restoreFiles(ids);
            if (res.success) {
                toast.success(`Đã khôi phục ${selectedFiles.length} mục.`);
                fetchTrashFiles(); // Reload list
                setSelectedFiles([]);
            }
        } catch (error) {
            toast.error("Khôi phục thất bại.");
        } finally {
            setActionLoading(false);
        }
    };

    // 2. Xóa vĩnh viễn (Bước 1: Mở Modal)
    const handleDeleteForeverClick = () => {
        if (selectedFiles.length === 0) return;
        setShowConfirmDelete(true);
    };

    // 3. Xóa vĩnh viễn (Bước 2: Gọi API)
    const confirmDeleteForever = async () => {
        setActionLoading(true);
        try {
            const ids = selectedFiles.map(f => f.id);
            const res = await fileService.deletePermanently(ids);
            if (res.success) {
                toast.success("Đã xóa vĩnh viễn.");
                fetchTrashFiles();
                setSelectedFiles([]);
                setShowConfirmDelete(false);
            }
        } catch (error) {
            toast.error("Xóa thất bại.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleBreadcrumbClick = (item) => {
        if (!item.id) setSearchParams({}); // Về gốc thùng rác
        else setSearchParams({ parentId: item.id });
    };

    // Helper Icons
    const getFileIcon = (type, mimeType) => {
        if (type === 'FOLDER') return <FaFolder className="text-yellow-500 text-2xl" />;
        if (mimeType?.includes('pdf')) return <FaFilePdf className="text-red-500 text-2xl" />;
        if (mimeType?.includes('word')) return <FaFileWord className="text-blue-500 text-2xl" />;
        if (mimeType?.includes('image')) return <FaFileImage className="text-purple-500 text-2xl" />;
        return <FaFileAlt className="text-gray-400 text-2xl" />;
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <FaTrash className="text-red-500 text-2xl" />
                    <h1 className="text-2xl font-bold text-gray-800">Thùng rác</h1>
                </div>

                {/* View Switcher */}
                <div className="flex bg-white p-1 rounded-lg border shadow-sm">
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}><FaList /></button>
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}><FaThLarge /></button>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 bg-white p-2 rounded border">
                {breadcrumbs.map((item, index) => (
                    <React.Fragment key={item.id || 'root'}>
                        <button onClick={() => handleBreadcrumbClick(item)} className="hover:text-blue-600 font-medium flex items-center gap-1">
                            {index === 0 && <FaHome />} {item.name}
                        </button>
                        {index < breadcrumbs.length - 1 && <FaChevronRight className="text-gray-300 text-xs" />}
                    </React.Fragment>
                ))}
            </div>

            {/* TOOLBAR ACTIONS */}
            {selectedFiles.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4 flex justify-between items-center animate-fade-in">
                    <span className="font-bold text-red-800 text-sm ml-2">{selectedFiles.length} mục đang chọn</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleRestore}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 border border-green-200 hover:bg-green-50 rounded shadow-sm text-sm font-bold transition"
                        >
                            <FaTrashRestore /> Khôi phục
                        </button>
                        <button 
                            onClick={handleDeleteForeverClick}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded shadow-sm text-sm font-bold transition"
                        >
                            <FaBan /> Xóa vĩnh viễn
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? <Loading /> : files.length === 0 ? (
                <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-xl">
                    <FaTrash className="mx-auto text-4xl mb-3 opacity-20" />
                    <p>Thùng rác trống</p>
                </div>
            ) : (
                <>
                    {/* LIST VIEW */}
                    {viewMode === 'list' && (
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                                    <tr>
                                        <th className="p-4 w-10 text-center"><button onClick={handleSelectAll}>{selectedFiles.length === files.length ? <FaCheckSquare className="text-blue-600 text-lg"/> : <FaSquare className="text-gray-300 text-lg"/>}</button></th>
                                        <th className="p-4">Tên</th>
                                        <th className="p-4">Ngày xóa</th>
                                        <th className="p-4">Kích thước</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-gray-700">
                                    {files.map(file => {
                                        const isSelected = selectedFiles.some(f => f.id === file.id);
                                        return (
                                            <tr key={file.id} 
                                                onClick={(e) => handleSmartClick(e, file)}
                                                onDoubleClick={() => handleDoubleClick(file)}
                                                className={`border-b hover:bg-gray-50 cursor-pointer select-none ${isSelected ? 'bg-blue-50' : ''}`}
                                            >
                                                <td className="p-4 text-center checkbox-area">
                                                    <button onClick={(e) => handleSelectFile(e, file)}>
                                                        {isSelected ? <FaCheckSquare className="text-blue-600 text-lg"/> : <FaSquare className="text-gray-300 text-lg hover:text-gray-400"/>}
                                                    </button>
                                                </td>
                                                <td className="p-4 flex items-center gap-3">
                                                    {getFileIcon(file.type, file.mimeType)}
                                                    <span className="truncate max-w-[300px] font-medium">{file.name}</span>
                                                </td>
                                                {/* Backend cần trả về deletedAt, nếu chưa có thì dùng updatedAt tạm */}
                                                <td className="p-4">{formatDate(file.updatedAt)}</td> 
                                                <td className="p-4">{file.type === 'FOLDER' ? '--' : formatBytes(file.size)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* GRID VIEW */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {files.map(file => {
                                const isSelected = selectedFiles.some(f => f.id === file.id);
                                return (
                                    <div key={file.id}
                                        onClick={(e) => handleSmartClick(e, file)}
                                        onDoubleClick={() => handleDoubleClick(file)}
                                        className={`bg-white p-4 rounded-lg border shadow-sm cursor-pointer flex flex-col items-center text-center relative select-none group ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
                                    >
                                        <div className={`absolute top-2 left-2 checkbox-area ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition`}>
                                             <button onClick={(e) => handleSelectFile(e, file)}>
                                                {isSelected ? <FaCheckSquare className="text-blue-600 text-lg bg-white"/> : <FaSquare className="text-gray-300 text-lg hover:text-gray-400"/>}
                                             </button>
                                        </div>
                                        <div className="mb-3">{getFileIcon(file.type, file.mimeType)}</div>
                                        <p className="text-sm font-medium text-gray-800 truncate w-full" title={file.name}>{file.name}</p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}

            {/* MODAL XÁC NHẬN XÓA VĨNH VIỄN */}
            <ConfirmModal 
                isOpen={showConfirmDelete}
                onClose={() => setShowConfirmDelete(false)}
                onConfirm={confirmDeleteForever}
                title="Xóa vĩnh viễn?"
                message={`Bạn có chắc chắn muốn xóa ${selectedFiles.length} mục này vĩnh viễn không? Hành động này KHÔNG THỂ hoàn tác.`}
                isLoading={actionLoading}
                isDanger={true}
                confirmText="Xóa vĩnh viễn"
            />
        </div>
    );
};

export default TrashPage;