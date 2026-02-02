import axiosClient from '../api/axiosClient';

/**
 * Service quản lý Activity Log
 * (Chuyển từ web sang mobile)
 */
const activityService = {
    /**
     * Lấy activity của một file/folder (bao gồm con cháu nếu là folder)
     * @param {string} nodeId - ID của file/folder
     * @param {Object} params - Các tham số filter và pagination
     */
    getNodeActivities: async (nodeId, params = {}) => {
        const {
            page = 0,
            size = 20,
            actionTypes = null,
            actorId = null,
            fromDate = null,
            toDate = null
        } = params;

        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('size', size);

        if (actionTypes && actionTypes.length > 0) {
            actionTypes.forEach(type => queryParams.append('actionTypes', type));
        }
        if (actorId) queryParams.append('actorId', actorId);
        if (fromDate) queryParams.append('fromDate', fromDate);
        if (toDate) queryParams.append('toDate', toDate);

        const response = await axiosClient.get(
            `/activities/node/${nodeId}?${queryParams.toString()}`
        );
        return response.data || response;
    },

    /**
     * Lấy activity do user hiện tại thực hiện (có phân trang)
     * @param {number} page - Số trang (bắt đầu từ 0)
     * @param {number} size - Kích thước trang
     */
    getMyActivities: async (page = 0, size = 20) => {
        const response = await axiosClient.get('/activities/me', {
            params: { page, size }
        });
        return response.data || response;
    },

    /**
     * Lấy activity gần đây (cho Dashboard, không phân trang)
     * @param {number} limit - Số lượng tối đa
     */
    getRecentActivities: async (limit = 30) => {
        const response = await axiosClient.get('/activities/recent', {
            params: { limit }
        });
        return response.data || response;
    }
};

export default activityService;