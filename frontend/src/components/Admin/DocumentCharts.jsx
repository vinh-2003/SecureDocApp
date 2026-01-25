import React from 'react';
import { 
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

// Màu sắc cho biểu đồ trạng thái
const STATUS_COLORS = {
    AVAILABLE: '#10B981', // Green
    PROCESSING: '#3B82F6', // Blue
    PENDING: '#F59E0B',    // Orange
    FAILED: '#EF4444'      // Red
};

const DEFAULT_COLOR = '#9CA3AF'; // Gray

// Màu sắc cho biểu đồ loại file
const TYPE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

const DocumentCharts = ({ statusData, mimeTypeData }) => {

    // 1. Chuyển đổi Object { KEY: value } sang Array [{ name: KEY, value: value }]
    // Backend trả về: { "AVAILABLE": 100, "FAILED": 5 }
    const formattedStatusData = Object.entries(statusData || {}).map(([key, value]) => ({
        name: key,
        value: value
    })).filter(item => item.value > 0); // Chỉ hiện cái nào có dữ liệu

    const formattedTypeData = Object.entries(mimeTypeData || {}).map(([key, value]) => ({
        name: key,
        value: value
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* --- BIỂU ĐỒ TRÒN: TRẠNG THÁI --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Trạng thái tài liệu</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={formattedStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60} // Tạo hiệu ứng Doughnut (rỗng ruột)
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {formattedStatusData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={STATUS_COLORS[entry.name] || DEFAULT_COLOR} 
                                    />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value) => [value, 'Số lượng']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- BIỂU ĐỒ CỘT: LOẠI FILE --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Phân bố loại tệp (Top 5)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={formattedTypeData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={60} 
                                tick={{ fontSize: 12 }} 
                            />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                {formattedTypeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DocumentCharts;