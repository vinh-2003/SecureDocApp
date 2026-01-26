import React from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';

// Components & Hooks
import { useAccessLogs } from '../../hooks';
import { LogsTable } from '../../components/Admin';
import { Loading } from '../../components/Common';

const AccessLogPage = () => {
    // Sử dụng Custom Hook
    const { 
        logs, loading, pagination, 
        setKeyword, setActionFilter, fetchLogs 
    } = useAccessLogs();

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Nhật ký truy cập</h1>
                        <p className="text-sm text-gray-500">
                            Giám sát hoạt động đăng nhập hệ thống
                        </p>
                    </div>

                    {/* Filters Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        
                        {/* 1. Action Dropdown */}
                        <div className="relative">
                            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                onChange={(e) => setActionFilter(e.target.value)}
                                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm w-full sm:w-48 appearance-none cursor-pointer hover:bg-gray-50"
                            >
                                <option value="ALL">Tất cả hành động</option>
                                <option value="LOGIN">Đăng nhập (Login)</option>
                                <option value="GOOGLE_LOGIN">Google Login</option>
                                <option value="LOGOUT">Đăng xuất (Logout)</option>
                                <option value="REFRESH_TOKEN">Làm mới Token</option>
                            </select>
                        </div>

                        {/* 2. Search Input */}
                        <div className="relative w-full sm:w-64">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm Username hoặc IP..."
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                {loading ? (
                    <Loading variant="inline" text="Đang tải dữ liệu..." />
                ) : (
                    <LogsTable 
                        logs={logs}
                        pagination={pagination}
                        onPageChange={(p) => fetchLogs(p)}
                    />
                )}
            </div>
        </div>
    );
};

export default AccessLogPage;