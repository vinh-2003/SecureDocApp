// src/components/FileViewer/ManageAccessModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaUserCircle } from 'react-icons/fa';
import fileService from '../../services/fileService';
import { toast } from 'react-toastify';
import ConfirmModal from '../Common/ConfirmModal';

const ManageAccessModal = ({ isOpen, onClose, fileId }) => {
    const [accessList, setAccessList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- STATE MỚI CHO MODAL XÁC NHẬN ---
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [revoking, setRevoking] = useState(false); // Loading khi đang xoá
    const [targetRevoke, setTargetRevoke] = useState(null); // Lưu { userId, pageIndex } đang chọn xoá

    // Fetch dữ liệu khi mở modal
    useEffect(() => {
        if (isOpen && fileId) {
            fetchAccessList();
        }
        // eslint-disable-next-line
    }, [isOpen, fileId]);

    const fetchAccessList = async () => {
        try {
            setLoading(true);
            const res = await fileService.getGrantedAccessList(fileId);
            if (res.success) {
                setAccessList(res.data);
            }
        } catch (error) {
            toast.error("Lỗi tải danh sách quyền.");
        } finally {
            setLoading(false);
        }
    };

    // 1. Sửa hàm này: Chỉ lưu thông tin và mở Modal
    const handleRevokeClick = (userId, pageIndex) => {
        setTargetRevoke({ userId, pageIndex });
        setConfirmOpen(true);
    };

    // 2. Viết hàm thực thi: Được gọi khi bấm nút "Xác nhận" ở Modal
    const confirmRevoke = async () => {
        if (!targetRevoke) return;

        const { userId, pageIndex } = targetRevoke;
        setRevoking(true);

        try {
            const res = await fileService.revokePageAccess(fileId, userId, pageIndex); // Đảm bảo tên hàm đúng với service
            if (res.success) {
                toast.success(`Đã thu hồi quyền trang ${pageIndex + 1}`);
                
                // Cập nhật list
                setAccessList(prev => prev.filter(item => !(item.userId === userId && item.pageIndex === pageIndex)));
                
                // Đóng modal xác nhận
                setConfirmOpen(false);
                setTargetRevoke(null);
            }
        } catch (error) {
            toast.error("Thu hồi thất bại. Vui lòng thử lại.");
        } finally {
            setRevoking(false);
        }
    };

    // --- LOGIC NHÓM DỮ LIỆU ---
    // Backend trả về danh sách phẳng (mỗi trang 1 dòng). Ta nhóm lại theo User để hiển thị đẹp hơn.
    const groupedUsers = React.useMemo(() => {
        const groups = {};
        
        accessList.forEach(item => {
            if (!groups[item.userId]) {
                groups[item.userId] = {
                    userId: item.userId,
                    fullName: item.userFullName,
                    email: item.userEmail,
                    avatar: item.userAvatar,
                    pages: []
                };
            }
            groups[item.userId].pages.push(item.pageIndex);
        });

        // Chuyển object thành array để map và Filter theo Search Term
        return Object.values(groups).filter(user => 
            user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [accessList, searchTerm]);

    if (!isOpen) return null;

    return (
        <>
            {/* --- MODAL CHÍNH --- */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        
                        {/* Header */}
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Quản lý quyền truy cập</h3>
                                <p className="text-xs text-gray-500">Kiểm soát ai đang xem trang nào của tài liệu này</p>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                                <FaTimes size={20} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 border-b bg-white">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm theo tên hoặc email người dùng..." 
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* List Users */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/50">
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Đang tải dữ liệu...</div>
                            ) : groupedUsers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 italic">
                                    {searchTerm ? "Không tìm thấy user nào." : "Chưa có quyền nào được cấp (ngoài owner)."}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {groupedUsers.map((user) => (
                                        <div key={user.userId} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                                            {/* User Info */}
                                            <div className="flex items-center gap-3 mb-3 border-b pb-2">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt="avt" className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                                        <FaUserCircle size={24} />
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="font-bold text-gray-800 text-sm">{user.fullName}</h4>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>

                                            {/* Pages List (Tags) */}
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Các trang được phép xem:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {user.pages.sort((a,b) => a - b).map((pageIndex) => (
                                                        <div 
                                                            key={pageIndex} 
                                                            className="group flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-medium"
                                                        >
                                                            <span>Trang {pageIndex + 1}</span>
                                                            
                                                            {/* Nút Xoá Quyền */}
                                                            <button 
                                                                onClick={() => handleRevokeClick(user.userId, pageIndex)} // <--- SỬA Ở ĐÂY
                                                                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-500 hover:text-white text-green-600 transition ml-1"
                                                                title="Thu hồi quyền trang này"
                                                            >
                                                                <FaTimes size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL XÁC NHẬN (Nằm đè lên trên Modal chính) --- */}
            <ConfirmModal 
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmRevoke}
                title="Xác nhận thu hồi quyền"
                message={`Bạn có chắc chắn muốn thu hồi quyền xem Trang ${targetRevoke ? targetRevoke.pageIndex + 1 : ''} của người dùng này không? Hành động này không thể hoàn tác.`}
                isLoading={revoking}
                isDanger={true}
                confirmText="Thu hồi ngay"
            />
        </>

        
    );
};

export default ManageAccessModal;