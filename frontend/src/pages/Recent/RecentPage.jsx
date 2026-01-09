// src/pages/RecentPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import fileService from '../../services/fileService';
import { FaClock, FaList, FaThLarge, FaFileAlt, FaFilePdf, FaFileWord, FaFileImage } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale'; // Format tiếng Việt

const RecentPage = () => {
    const navigate = useNavigate();
    
    // DATA STATE
    const [recentItems, setRecentItems] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // UI STATE
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

    // INFINITE SCROLL REF
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

    // LOAD DATA
    useEffect(() => {
        const fetchRecent = async () => {
            setLoading(true);
            try {
                const limit = 12; // Lấy 12 item mỗi lần
                const res = await fileService.getRecentFiles(page, limit);
                
                if (res.success) {
                    const newItems = res.data;
                    
                    // Nếu dữ liệu trả về ít hơn limit -> Hết dữ liệu
                    if (newItems.length < limit) setHasMore(false);

                    // Nối dữ liệu cũ + mới (Dùng Set để tránh duplicate ID nếu mạng lag)
                    setRecentItems(prev => {
                        const uniqueMap = new Map();
                        [...prev, ...newItems].forEach(item => uniqueMap.set(item.file.id, item));
                        return Array.from(uniqueMap.values());
                    });
                }
            } catch (error) {
                console.error("Lỗi tải file", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecent();
    }, [page]);

    // HELPERS
    const handleFileClick = (file) => {
        const isViewable = file.mimeType === 'application/pdf' || file.name.endsWith('.docx');
        if (isViewable) navigate(`/file/view/${file.id}`);
        else window.open(`${process.env.REACT_APP_API_URL}/files/download/${file.id}`, '_blank');
    };

    const getFileIcon = (mimeType) => {
        if (mimeType.includes('pdf')) return <FaFilePdf className="text-red-500" size={viewMode === 'grid' ? 40 : 24} />;
        if (mimeType.includes('word') || mimeType.includes('officedocument')) return <FaFileWord className="text-blue-600" size={viewMode === 'grid' ? 40 : 24} />;
        if (mimeType.includes('image')) return <FaFileImage className="text-purple-500" size={viewMode === 'grid' ? 40 : 24} />;
        return <FaFileAlt className="text-gray-500" size={viewMode === 'grid' ? 40 : 24} />;
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FaClock className="text-blue-600 text-xl" />
                    <h1 className="text-2xl font-bold text-gray-800">Mở gần đây</h1>
                </div>

                {/* View Switcher */}
                <div className="bg-white p-1 rounded-lg border shadow-sm flex">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Dạng danh sách"
                    >
                        <FaList />
                    </button>
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Dạng lưới"
                    >
                        <FaThLarge />
                    </button>
                </div>
            </div>

            {/* Content */}
            {recentItems.length === 0 && !loading ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                    <p className="text-gray-500">Bạn chưa xem tài liệu nào gần đây.</p>
                </div>
            ) : (
                <>
                    {/* --- VIEW MODE: LIST --- */}
                    {viewMode === 'list' ? (
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
                                    <tr>
                                        <th className="p-4 font-semibold">Tên tài liệu</th>
                                        <th className="p-4 font-semibold">Thời điểm mở</th>
                                        <th className="p-4 font-semibold w-32">Kích thước</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentItems.map((item, index) => {
                                        // Kiểm tra nếu là phần tử cuối cùng để gắn ref
                                        const isLast = index === recentItems.length - 1;
                                        return (
                                            <tr 
                                                key={item.file.id} 
                                                ref={isLast ? lastElementRef : null}
                                                onClick={() => handleFileClick(item.file)}
                                                className="hover:bg-blue-50 cursor-pointer transition"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        {getFileIcon(item.file.mimeType)}
                                                        <span className="font-medium text-gray-800">{item.file.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-gray-500">
                                                    {formatDistanceToNow(new Date(item.accessedAt), { addSuffix: true, locale: vi })}
                                                </td>
                                                <td className="p-4 text-sm text-gray-500">
                                                    {(item.file.size / 1024).toFixed(1)} KB
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* --- VIEW MODE: GRID --- */
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {recentItems.map((item, index) => {
                                const isLast = index === recentItems.length - 1;
                                return (
                                    <div 
                                        key={item.file.id}
                                        ref={isLast ? lastElementRef : null}
                                        onClick={() => handleFileClick(item.file)}
                                        className="bg-white p-4 rounded-xl border hover:shadow-md hover:border-blue-400 transition cursor-pointer flex flex-col items-center text-center group"
                                    >
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            {getFileIcon(item.file.mimeType)}
                                        </div>
                                        <h3 className="font-medium text-gray-800 text-sm line-clamp-2 w-full mb-1" title={item.file.name}>
                                            {item.file.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-auto pt-2 border-t w-full">
                                            {formatDistanceToNow(new Date(item.accessedAt), { addSuffix: true, locale: vi })}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Loading Indicator dưới cùng */}
                    {loading && (
                        <div className="py-4 text-center">
                            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                    )}
                    
                    {!hasMore && recentItems.length > 0 && (
                        <div className="py-6 text-center text-xs text-gray-400 uppercase tracking-widest">
                            --- Hết danh sách ---
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RecentPage;