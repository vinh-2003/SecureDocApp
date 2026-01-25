import React, { useEffect, useState } from 'react';
import { FaHdd, FaFileAlt, FaFolder, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Components & Services
import adminService from '../../services/adminService';
import { Loading } from '../../components/Common';
import DocumentCharts from '../../components/Admin/DocumentCharts';
import { formatBytes } from '../../utils/format'; // Hàm formatBytes bạn đã có

const DocumentMonitorPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await adminService.getDocumentStats();
            if (res.success) {
                setStats(res.data);
            }
        } catch (error) {
            toast.error('Không thể tải dữ liệu thống kê');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading variant="page" text="Đang phân tích dữ liệu..." />;
    if (!stats) return <div className="p-6">Không có dữ liệu.</div>;

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-auto">
            {/* Header */}
            <div className="bg-white border-b px-8 py-5">
                <h1 className="text-2xl font-bold text-gray-800">Giám sát tài liệu</h1>
                <p className="text-sm text-gray-500 mt-1">Tổng quan về tình trạng lưu trữ và sức khỏe hệ thống</p>
            </div>

            <div className="p-8 max-w-7xl mx-auto w-full">
                {/* 1. INFO CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard 
                        title="Dung lượng lưu trữ" 
                        value={formatBytes(stats.totalSize)} 
                        icon={FaHdd} 
                        color="bg-blue-500" 
                    />
                    <StatCard 
                        title="Tổng số tệp tin" 
                        value={stats.totalFiles.toLocaleString()} 
                        icon={FaFileAlt} 
                        color="bg-green-500" 
                    />
                    <StatCard 
                        title="Tổng số thư mục" 
                        value={stats.totalFolders.toLocaleString()} 
                        icon={FaFolder} 
                        color="bg-purple-500" 
                    />
                    <StatCard 
                        title="Dữ liệu rác" 
                        value={formatBytes(stats.trashSize)} 
                        subValue={`${stats.trashFiles} tệp`}
                        icon={FaTrash} 
                        color="bg-red-400" 
                    />
                </div>

                {/* 2. CHARTS AREA */}
                <DocumentCharts 
                    statusData={stats.statusDistribution} 
                    mimeTypeData={stats.mimeTypeDistribution} 
                />

                {/* 3. ALERT SECTION (Chỉ hiện nếu có file lỗi) */}
                {stats.statusDistribution?.FAILED > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full text-red-600">
                                <FaExclamationTriangle size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-red-800">Cảnh báo hệ thống</h3>
                        </div>
                        <p className="text-red-700 mb-4">
                            Hệ thống phát hiện <strong>{stats.statusDistribution.FAILED}</strong> tệp tin gặp lỗi trong quá trình xử lý (Mã hóa/Bóc tách).
                            Vui lòng kiểm tra để đảm bảo toàn vẹn dữ liệu.
                        </p>
                        {/* Bạn có thể thêm nút "Xem chi tiết" để link sang trang danh sách file lỗi */}
                        <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">
                            Xem danh sách tệp lỗi
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Component con hiển thị thẻ Card (để code gọn hơn)
const StatCard = ({ title, value, subValue, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition hover:shadow-md">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
            {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${color} shadow-lg shadow-opacity-30`}>
            <Icon size={24} />
        </div>
    </div>
);

export default DocumentMonitorPage;