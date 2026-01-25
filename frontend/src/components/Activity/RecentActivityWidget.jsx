import React, { useContext } from 'react';
import { FaHistory, FaSpinner, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useActivityLog } from '../../hooks';
import { AuthContext } from '../../context/AuthContext';
import ActivityItem from './ActivityItem';

/**
 * Widget hiển thị hoạt động gần đây (cho Dashboard)
 */
const RecentActivityWidget = ({ limit = 5 }) => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const {
        activities,
        loading,
        error
    } = useActivityLog(null, {
        autoLoad: true,
        pageSize: limit,
        mode: 'recent'
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FaHistory className="text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Hoạt động gần đây</h3>
                </div>
                <button
                    onClick={() => navigate('/activities')}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    Xem tất cả
                    <FaArrowRight size={10} />
                </button>
            </div>

            {/* Content */}
            <div className="divide-y divide-gray-50">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <FaSpinner className="animate-spin text-blue-600" size={20} />
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        Không thể tải hoạt động
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        Chưa có hoạt động nào
                    </div>
                ) : (
                    activities.slice(0, limit).map(activity => (
                        <ActivityItem
                            key={activity.id}
                            activity={activity}
                            currentUserId={user?.id}
                            showTarget={true}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentActivityWidget;