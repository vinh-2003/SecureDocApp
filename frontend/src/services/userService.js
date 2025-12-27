import axiosClient from '../api/axiosClient';

const userService = {
    findUserByEmail: (email) => {
        return axiosClient.get(`/users/find-by-email`, { params: { email } });
    },

    getUserById: (id) => {
        return axiosClient.get(`/users/${id}`); 
    },

    changePassword: (data) => {
        return axiosClient.put('/users/change-password', data);
    },

    // Lấy thông tin profile người dùng hiện tại
    getProfile: () => {
        return axiosClient.get('/users/profile');
    },

    // Cập nhật profile (Gửi FormData vì có file ảnh)
    updateProfile: (formData) => {
        return axiosClient.put('/users/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
};

export default userService;