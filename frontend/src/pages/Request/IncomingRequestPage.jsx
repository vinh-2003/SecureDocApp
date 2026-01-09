// src/pages/IncomingRequestPage.jsx
import React, { useState, useEffect } from 'react';
import fileService from '../../services/fileService';
import userService from '../../services/userService';
import { FaCheck, FaTimes, FaUser, FaFileAlt, FaClock, FaUserShield } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/format';

const IncomingRequestPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Hàm lấy danh sách và "làm giàu" dữ liệu (Lấy tên file từ fileId)
    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fileService.getIncomingRequests();
            
            if (res.success && res.data.length > 0) {
                const rawRequests = res.data;

                // Dùng Promise.all để lấy thông tin chi tiết File và User song song
                const enrichedRequests = await Promise.all(rawRequests.map(async (req) => {
                    // 1. Lấy thông tin File
                    const filePromise = fileService.getFileDetails(req.fileId).catch(() => null);
                    
                    // 2. Lấy thông tin User (Dùng API mới thêm)
                    const userPromise = userService.getUserById(req.requesterId).catch(() => null);

                    // Chờ cả 2 xong
                    const [fileRes, userRes] = await Promise.all([filePromise, userPromise]);
                    
                    const fileData = fileRes?.data;
                    const userData = userRes?.data; // UserInfoResponse từ Backend

                    return {
                        ...req,
                        // Data File
                        fileName: fileData?.name || 'Tài liệu không xác định',
                        
                        // Data User (Map từ UserInfoResponse)
                        requesterName: userData?.fullName || userData?.username || req.requesterId, // Ưu tiên FullName -> Username -> ID
                        requesterEmail: userData?.email || 'Email ẩn',
                        requesterAvatar: userData?.avatarUrl || null
                    };
                }));

                setRequests(enrichedRequests);
            } else {
                setRequests([]);
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
            toast.error("Không thể tải danh sách yêu cầu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleProcess = async (requestId, isApproved) => {
        try {
            const res = await fileService.processAccessRequest(requestId, isApproved);
            if (res.success) {
                toast.success(isApproved ? "Đã cấp quyền truy cập." : "Đã từ chối yêu cầu.");
                setRequests(prev => prev.filter(r => r.id !== requestId));
            }
        } catch (error) {
            toast.error("Xử lý thất bại. Vui lòng thử lại.");
        }
    };

    if (loading) return (
        <div className="p-8 text-center text-gray-500">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Đang tải danh sách yêu cầu...</p>
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaUserShield className="text-blue-600" /> 
                    Quản lý Yêu cầu Truy cập
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Duyệt các yêu cầu xem tài liệu bị khóa từ người dùng khác.
                </p>
            </div>

            {/* Content */}
            {requests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaCheck size={30} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700">Tuyệt vời!</h3>
                    <p className="text-gray-500">Bạn đã xử lý hết các yêu cầu.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider border-b">
                                    <th className="p-4 font-bold">Người yêu cầu</th>
                                    <th className="p-4 font-bold">Tài liệu</th>
                                    <th className="p-4 font-bold">Chi tiết xin quyền</th>
                                    <th className="p-4 font-bold">Thời gian</th>
                                    <th className="p-4 font-bold text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-blue-50/40 transition group">
                                        {/* 1. SỬA PHẦN HIỂN THỊ USER */}
                                        <td className="p-4 align-top">
                                            <div className="flex items-center gap-3">
                                                {/* Avatar */}
                                                {req.requesterAvatar ? (
                                                    <img 
                                                        src={req.requesterAvatar} 
                                                        alt="avt" 
                                                        className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
                                                        <FaUser />
                                                    </div>
                                                )}
                                                
                                                {/* Tên & Email */}
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">
                                                        {req.requesterName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{req.requesterEmail}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 2. Tài liệu */}
                                        <td className="p-4 align-top">
                                            <div className="flex items-start gap-2">
                                                <FaFileAlt className="text-gray-400 mt-1" />
                                                <div>
                                                    <p 
                                                        className="font-medium text-blue-600 hover:underline cursor-pointer text-sm"
                                                        onClick={() => navigate(`/file/view/${req.fileId}`)}
                                                    >
                                                        {req.fileName}
                                                    </p>
                                                    <p className="text-xs text-gray-400 font-mono mt-0.5" title={req.fileId}>
                                                        ID: {req.fileId.substring(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 3. Chi tiết (Trang + Lý do) */}
                                        <td className="p-4 align-top max-w-xs">
                                            <div className="mb-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    {req.pageIndexes?.length || 0} trang
                                                </span>
                                                <span className="text-xs text-gray-500 ml-2">
                                                    (Trang: {req.pageIndexes?.map(i => i + 1).join(', ')})
                                                </span>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded border border-gray-100 text-sm text-gray-600 italic">
                                                "{req.reason}"
                                            </div>
                                        </td>

                                        {/* 4. Thời gian */}
                                        <td className="p-4 align-top text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <FaClock className="text-gray-300" />
                                                {formatDate(req.createdAt)}
                                            </div>
                                        </td>

                                        {/* 5. Hành động */}
                                        <td className="p-4 align-top text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleProcess(req.id, false)}
                                                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50 transition text-sm font-medium"
                                                >
                                                    <FaTimes /> Từ chối
                                                </button>
                                                <button 
                                                    onClick={() => handleProcess(req.id, true)}
                                                    className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition text-sm font-medium"
                                                >
                                                    <FaCheck /> Duyệt
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomingRequestPage;