import axiosClient from '../api/axiosClient';

const authService = {
  login: (username, password) => {
    return axiosClient.post('/auth/signin', { username, password });
  },

  register: (data) => {
    // data gồm: username, email, password, fullName...
    return axiosClient.post('/auth/signup', data);
  },

  googleLogin: (idToken) => {
    return axiosClient.post('/auth/google', { idToken });
  },

  verifyAccount: (token) => {
    return axiosClient.get(`/auth/verify?token=${token}`);
  },

  // Gửi yêu cầu quên mật khẩu (Backend nhận @RequestParam email)
  forgotPassword: (email) => {
    // Cách gửi POST với Query Param trong Axios
    return axiosClient.post('/auth/forgot-password', null, {
      params: { email }
    });
  },

  // Đặt lại mật khẩu (Backend nhận Body JSON: { token, newPassword })
  resetPassword: (token, newPassword) => {
    return axiosClient.post('/auth/reset-password', { token, newPassword });
  },
  
  logout: () => {
      return axiosClient.post('/auth/signout');
  }
};

export default authService;