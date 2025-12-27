import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      toast.success('Link đặt lại mật khẩu đã được gửi vào email của bạn!');
    } catch (error) {
      const message = error.response?.data?.message || 'Không tìm thấy email này trong hệ thống.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Quên mật khẩu?</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Nhập email của bạn, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Email đã đăng ký</label>
            <input 
              type="email"
              {...register('email', { 
                required: 'Vui lòng nhập email',
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

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white py-2 rounded transition font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Đang gửi...' : 'Gửi link xác nhận'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
            <Link to="/login" className="text-gray-600 hover:text-blue-600 flex items-center justify-center gap-1">
              &larr; Quay lại Đăng nhập
            </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;