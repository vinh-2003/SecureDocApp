// src/pages/SharedPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import fileService from '../services/fileService';
import { 
    FaShareAlt, FaList, FaThLarge, FaFolder, 
    FaFilePdf, FaFileWord, FaFileImage, FaFileAlt, FaUserCircle 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { formatBytes, formatDate } from '../utils/format'; // Hàm tiện ích có sẵn
import Loading from '../components/Loading'; // Component loading có sẵn

const SharedPage = () => {
    const navigate = useNavigate();

    // --- STATE ---
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true); // Kiểm tra còn dữ liệu để tải không
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

    // --- INFINITE SCROLL REF ---
    const observer = useRef();
    const lastElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1); // Tăng trang -> Trigger useEffect
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // --- LOAD DATA ---
    useEffect(() => {
        const fetchShared = async () => {
            setLoading(true);
            try {
                const limit = 20; 
                const res = await fileService.getSharedFiles(page, limit);
                
                if (res.success) {
                    const newFiles = res.data;
                    
                    // Nếu dữ liệu trả về ít hơn limit -> Hết dữ liệu
                    if (newFiles.length < limit) setHasMore(false);

                    // Nối dữ liệu (Dùng Map để lọc trùng ID nếu mạng lag)
                    setFiles(prev => {
                        const uniqueMap = new Map();
                        [...prev, ...newFiles].forEach(f => uniqueMap.set(f.id, f));
                        return Array.from(uniqueMap.values());
                    });
                }
            } catch (error) {
                console.error("Lỗi tải file chia sẻ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchShared();
    }, [page]);

    // --- HELPERS ---
    
    // Xử lý khi click vào item
    const handleItemClick = (file) => {
        if (file.type === 'FOLDER') {
            // Nếu là Folder được share -> Vào xem nội dung bên trong
            // (Tận dụng route xem folder cũ, vì Backend đã check quyền ở đó rồi)
            navigate(`/folders/${file.id}`);
        } else {
            // Nếu là File -> Xem/Tải
            handleFileClick(file);
        }
    };

    const handleFileClick = (file) => {
        const isViewable = 
            file.mimeType === 'application/pdf' || 
            file.name.toLowerCase().endsWith('.docx') ||
            file.name.toLowerCase().endsWith('.doc');

        if (isViewable) {
            navigate(`/file/view/${file.id}`);
        } else {
             window.open(`${process.env.REACT_APP_API_URL}/files/download/${file.id}`, '_blank');
        }
    };

    // Helper lấy icon
    const getFileIcon = (type, mimeType) => {
        if (type === 'FOLDER') return <FaFolder className="text-yellow-500 text-2xl" />;
        if (mimeType?.includes('pdf')) return <FaFilePdf className="text-red-500 text-2xl" />;
        if (mimeType?.includes('word')) return <FaFileWord className="text-blue-500 text-2xl" />;
        if (mimeType?.includes('image')) return <FaFileImage className="text-purple-500 text-2xl" />;
        return <FaFileAlt className="text-gray-400 text-2xl" />;
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <FaShareAlt className="text-blue-600 text-2xl" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Được chia sẻ với tôi</h1>
                        <p className="text-xs text-gray-500">Các tập tin và thư mục bạn có quyền truy cập</p>
                    </div>
                </div>

                {/* View Switcher */}
                <div className="flex bg-white p-1 rounded-lg border shadow-sm">
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}><FaList /></button>
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}><FaThLarge /></button>
                </div>
            </div>

            {/* CONTENT */}
            {files.length === 0 && !loading ? (
                <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-xl bg-white">
                    <FaShareAlt className="mx-auto text-4xl mb-3 opacity-20" />
                    <p>Chưa có tài liệu nào được chia sẻ với bạn.</p>
                </div>
            ) : (
                <>
                    {/* --- LIST VIEW --- */}
                    {viewMode === 'list' && (
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                                    <tr>
                                        <th className="p-4">Tên</th>
                                        <th className="p-4">Được chia sẻ bởi</th>
                                        <th className="p-4 hidden sm:table-cell">Ngày chia sẻ</th>
                                        <th className="p-4 hidden md:table-cell">Kích thước</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-gray-700">
                                    {files.map((file, index) => {
                                        const isLast = index === files.length - 1;
                                        return (
                                            <tr 
                                                key={file.id} 
                                                ref={isLast ? lastElementRef : null}
                                                onClick={() => handleItemClick(file)}
                                                className="border-b hover:bg-blue-50 cursor-pointer transition"
                                            >
                                                <td className="p-4 flex items-center gap-3">
                                                    {getFileIcon(file.type, file.mimeType)}
                                                    <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                                                </td>
                                                
                                                {/* Cột Owner (Quan trọng cho trang Share) */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {file.ownerAvatar ? (
                                                            <img src={file.ownerAvatar} alt="owner" className="w-6 h-6 rounded-full object-cover" />
                                                        ) : (
                                                            <FaUserCircle className="text-gray-300 w-6 h-6" />
                                                        )}
                                                        <span className="text-gray-600 text-xs font-semibold truncate max-w-[150px]">
                                                            {file.ownerName || file.ownerEmail || "Unknown"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Backend trả về sharedAt hoặc updatedAt. Ở đây tạm dùng updatedAt hoặc logic sắp xếp của BE */}
                                                <td className="p-4 hidden sm:table-cell text-gray-500">
                                                    {formatDate(file.sharedAt)}
                                                </td>
                                                <td className="p-4 hidden md:table-cell text-gray-500">
                                                    {file.type === 'FOLDER' ? '--' : formatBytes(file.size)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* --- GRID VIEW --- */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {files.map((file, index) => {
                                const isLast = index === files.length - 1;
                                return (
                                    <div 
                                        key={file.id}
                                        ref={isLast ? lastElementRef : null}
                                        onClick={() => handleItemClick(file)}
                                        className="bg-white p-4 rounded-xl border hover:shadow-md hover:border-blue-400 transition cursor-pointer flex flex-col items-center text-center group relative"
                                    >
                                        <div className="mb-3 transform group-hover:scale-110 transition">
                                            {getFileIcon(file.type, file.mimeType)}
                                        </div>
                                        
                                        <h3 className="text-sm font-medium text-gray-800 truncate w-full mb-2" title={file.name}>
                                            {file.name}
                                        </h3>

                                        {/* Avatar Owner nhỏ ở góc dưới */}
                                        <div className="w-full pt-2 border-t flex items-center justify-center gap-1.5 mt-auto">
                                            {file.ownerAvatar ? (
                                                <img src={file.ownerAvatar} alt="owner" className="w-5 h-5 rounded-full" />
                                            ) : (
                                                <FaUserCircle className="text-gray-300 w-5 h-5" />
                                            )}
                                            <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
                                                {file.ownerName || file.ownerEmail || "Unknown"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="py-6 flex justify-center">
                            <Loading />
                        </div>
                    )}
                    
                    {!hasMore && files.length > 0 && (
                        <div className="py-6 text-center text-xs text-gray-400 uppercase tracking-widest">
                            --- Hết danh sách ---
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SharedPage;