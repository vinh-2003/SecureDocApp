// src/components/FileViewer/RequestAccessModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck } from 'react-icons/fa';
import fileService from '../../services/fileService';
import { toast } from 'react-toastify';

const RequestAccessModal = ({ isOpen, onClose, fileId, pages }) => {
    const [selectedPages, setSelectedPages] = useState([]);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    // Lọc ra những trang đang bị khoá VÀ người dùng chưa có quyền xem
    // (Để tránh việc họ xin lại quyền những trang đã có)
    const lockedPages = pages.filter(p => p.locked && !p.canViewClear);

    useEffect(() => {
        // Mặc định chọn tất cả các trang bị khoá
        if (isOpen) {
            setSelectedPages(lockedPages.map(p => p.pageIndex));
            setReason('');
        }
    }, [isOpen, pages]); // eslint-disable-line

    const handleTogglePage = (pageIndex) => {
        setSelectedPages(prev => 
            prev.includes(pageIndex) 
                ? prev.filter(p => p !== pageIndex) 
                : [...prev, pageIndex]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedPages.length === 0) {
            toast.warning("Vui lòng chọn ít nhất một trang.");
            return;
        }
        if (!reason.trim()) {
            toast.warning("Vui lòng nhập lý do.");
            return;
        }

        try {
            setLoading(true);
            await fileService.createAccessRequest(fileId, selectedPages, reason);
            toast.success("Đã gửi yêu cầu thành công!");
            onClose(); // Đóng modal
        } catch (error) {
            toast.error(error.response?.data?.message || "Gửi yêu cầu thất bại.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-down">
                
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Yêu cầu mở khoá</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Danh sách trang */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chọn các trang bạn muốn xem ({selectedPages.length} đã chọn):
                        </label>
                        <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50 custom-scrollbar grid grid-cols-4 gap-2">
                            {lockedPages.length > 0 ? lockedPages.map((page) => (
                                <div 
                                    key={page.id}
                                    onClick={() => handleTogglePage(page.pageIndex)}
                                    className={`cursor-pointer text-sm py-1 px-2 rounded border text-center transition ${
                                        selectedPages.includes(page.pageIndex)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                                    }`}
                                >
                                    Trang {page.pageIndex + 1}
                                </div>
                            )) : (
                                <p className="col-span-4 text-center text-sm text-gray-500 py-2">
                                    Không có trang nào cần mở khoá.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Lý do */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lý do xin quyền <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="VD: Em cần tài liệu này để làm đồ án môn học..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                        >
                            Huỷ bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading || lockedPages.length === 0}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Đang gửi...' : <><FaCheck /> Gửi yêu cầu</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestAccessModal;