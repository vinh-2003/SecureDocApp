import axiosClient from '../api/axiosClient';

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
        return response.data;
    },

    /**
     * Lấy activity do user hiện tại thực hiện
     */
    getMyActivities: async (page = 0, size = 20) => {
        const response = await axiosClient.get(
            `/activities/me?page=${page}&size=${size}`
        );
        return response.data;
    },

    /**
     * Lấy activity gần đây (cho Dashboard)
     */
    getRecentActivities: async (limit = 10) => {
        const response = await axiosClient.get(
            `/activities/recent?limit=${limit}`
        );
        return response.data;
    }
};

export default activityService;