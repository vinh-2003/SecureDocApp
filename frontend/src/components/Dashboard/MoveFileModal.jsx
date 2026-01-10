// src/components/Dashboard/MoveFileModal.jsx
import React, { useState, useEffect } from 'react';
import fileService from '../../services/fileService';
import { FaFolder, FaHome, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

const MoveFileModal = ({ isOpen, onClose, selectedItems, onSuccess }) => {
    // selectedItems: Danh sách các file/folder đang được chọn để di chuyển
    
    const [currentFolderId, setCurrentFolderId] = useState(null); // ID thư mục đang xem trong modal
    const [folders, setFolders] = useState([]); // Danh sách folder con
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Thư mục gốc' }]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Reset state khi mở modal
    useEffect(() => {
        if (isOpen) {
            setCurrentFolderId(null);
            setBreadcrumbs([{ id: null, name: 'Thư mục gốc' }]);
            fetchFolders(null);
        }
        // eslint-disable-next-line
    }, [isOpen]);

    // Hàm lấy danh sách folder (chỉ lấy folder, không lấy file)
    const fetchFolders = async (parentId) => {
        setLoading(true);
        try {
            // Sử dụng API getFiles cũ, nhưng lọc client-side chỉ lấy Folder
            // Hoặc nếu BE có API getFolders riêng thì dùng.
            // Ở đây giả định dùng getFiles và lọc type.
            const res = await fileService.getFiles(parentId);
            if (res.success) {
                // Lọc: Chỉ lấy Folder VÀ loại bỏ chính các folder đang được chọn (để tránh di chuyển vào chính nó)
                const validFolders = res.data.filter(item => {
                    const isFolder = item.type === 'FOLDER' || item.mimeType === 'application/vnd.google-apps.folder'; // Tuỳ cách bạn định nghĩa type
                    const isNotSelf = !selectedItems.some(selected => selected.id === item.id);
                    return isFolder && isNotSelf;
                });
                setFolders(validFolders);
            }
        } catch (error) {
            console.error("Lỗi tải thư mục:", error);
        } finally {
            setLoading(false);
        }
    };

    // Xử lý khi click vào một folder để đi sâu vào trong
    const handleEnterFolder = (folder) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
        fetchFolders(folder.id);
    };

    // Xử lý khi click vào breadcrumb để quay lại
    const handleBreadcrumbClick = (crumb, index) => {
        setCurrentFolderId(crumb.id);
        // Cắt bớt breadcrumb thừa phía sau
        setBreadcrumbs(prev => prev.slice(0, index + 1));
        fetchFolders(crumb.id);
    };

    // Xử lý xác nhận di chuyển
    const handleConfirmMove = async () => {
        if (selectedItems.length === 0) return;

        setSubmitting(true);
        try {
            // Gọi API Move
            const itemIds = selectedItems.map(item => item.id);
            const res = await fileService.moveFiles(itemIds, currentFolderId);
            
            if (res.success) {
                // Hiển thị thông báo từ server (có đếm thành công/thất bại)
                toast.success(res.message);
                onSuccess(); // Callback để reload danh sách ở Dashboard
                onClose();   // Đóng modal
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Di chuyển thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh] animate-fade-in-down">
                
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-gray-800">Di chuyển {selectedItems.length} mục đến...</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                </div>

                {/* Breadcrumbs Navigation */}
                <div className="px-4 py-2 bg-gray-100 border-b flex items-center gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.id || 'root'} className="flex items-center text-sm">
                            {index > 0 && <span className="mx-1 text-gray-400">/</span>}
                            <button 
                                onClick={() => handleBreadcrumbClick(crumb, index)}
                                className={`hover:text-blue-600 flex items-center gap-1 ${index === breadcrumbs.length - 1 ? 'font-bold text-gray-800' : 'text-gray-500'}`}
                            >
                                {index === 0 && <FaHome />} {crumb.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Folder List */}
                <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-gray-400">Đang tải...</div>
                    ) : folders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-70">
                            <FaFolder size={40} className="mb-2" />
                            <p>Thư mục trống</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {folders.map(folder => (
                                <div 
                                    key={folder.id}
                                    onClick={() => handleEnterFolder(folder)}
                                    className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer rounded-lg border border-transparent hover:border-blue-100 transition"
                                >
                                    <FaFolder className="text-yellow-500 text-xl" />
                                    <span className="text-gray-700 font-medium truncate flex-1">{folder.name}</span>
                                    <span className="text-xs text-gray-400">&rsaquo;</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                        disabled={submitting}
                    >
                        Huỷ bỏ
                    </button>
                    <button 
                        onClick={handleConfirmMove}
                        disabled={submitting || loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {submitting ? 'Đang chuyển...' : (
                            <>
                                <FaCheck /> Chuyển đến đây
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MoveFileModal;