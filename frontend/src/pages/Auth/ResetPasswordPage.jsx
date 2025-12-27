import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';

const ResetPasswordPage = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Hook để lấy query params từ URL (?token=...)
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Kiểm tra nếu không có token thì đuổi về trang login
  useEffect(() => {
    if (!token) {
        toast.error("Link không hợp lệ!");
        navigate('/login');
    }
  }, [token, navigate]);

  const password = watch("newPassword");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, data.newPassword);
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const message = error.response?.data?.message || 'Link đã hết hạn hoặc không hợp lệ.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null; // Tránh render form khi chưa có token

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center text-green-600">Đặt lại mật khẩu</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">Nhập mật khẩu mới cho tài khoản của bạn</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Mật khẩu mới</label>
            <input 
              type="password"
              {...register('newPassword', { 
                required: 'Mật khẩu không được để trống',
                minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
              })}
              className={`w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="******"
            />
            {errors.newPassword && <span className="text-red-500 text-xs">{errors.newPassword.message}</span>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Xác nhận mật khẩu</label>
            <input 
              type="password"
              {...register('confirmPassword', { 
                required: 'Vui lòng xác nhận mật khẩu',
                validate: value => value === password || "Mật khẩu nhập lại không khớp"
              })}
              className={`w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="******"
            />
            {errors.confirmPassword && <span className="text-red-500 text-xs">{errors.confirmPassword.message}</span>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white py-2 rounded transition font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;