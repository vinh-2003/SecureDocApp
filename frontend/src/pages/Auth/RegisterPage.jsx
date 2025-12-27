import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';

const RegisterPage = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Theo dõi giá trị password để so sánh với Confirm Password
  const password = watch("password");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Gọi API đăng ký
      await authService.register(data);
      
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.');
      
      // Chuyển hướng về trang login sau 2 giây
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      // Hiển thị lỗi từ Backend (ví dụ: Username đã tồn tại)
      const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center text-blue-600">Đăng ký tài khoản</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">Tạo tài khoản để quản lý tài liệu an toàn</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Họ và tên</label>
            <input 
              {...register('fullName', { required: 'Họ tên không được để trống' })}
              className={`w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Nguyễn Văn A"
            />
            {errors.fullName && <span className="text-red-500 text-xs">{errors.fullName.message}</span>}
          </div>

          {/* Username */}
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Tên đăng nhập</label>
            <input 
              {...register('username', { 
                required: 'Username không được để trống',
                minLength: { value: 4, message: 'Username phải từ 4 ký tự trở lên' }
              })}
              className={`w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="username123"
            />
            {errors.username && <span className="text-red-500 text-xs">{errors.username.message}</span>}
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Email</label>
            <input 
              type="email"
              {...register('email', { 
                required: 'Email không được để trống',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email không hợp lệ"
                }
              })}
              className={`w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="example@gmail.com"
            />
            {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Mật khẩu</label>
            <input 
              type="password"
              {...register('password', { 
                required: 'Mật khẩu không được để trống',
                minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
              })}
              className={`w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="******"
            />
            {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Nhập lại Mật khẩu</label>
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
            {loading ? 'Đang xử lý...' : 'Đăng ký Tài khoản'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
            Đã có tài khoản? <Link to="/login" className="text-blue-600 hover:underline font-medium">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;