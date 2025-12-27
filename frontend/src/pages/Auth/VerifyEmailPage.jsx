import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import authService from '../../services/authService';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Các trạng thái của trang: 'loading' | 'success' | 'error'
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Đang xác thực tài khoản của bạn...');
  
  // Dùng useRef để đảm bảo API chỉ gọi 1 lần (tránh React.StrictMode gọi 2 lần ở dev)
  const verifyCalled = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Đường dẫn xác thực không hợp lệ.');
      return;
    }

    if (verifyCalled.current) return;
    verifyCalled.current = true;

    const verifyToken = async () => {
      try {
        // Gọi API xác thực
        await authService.verifyAccount(token);
        
        setStatus('success');
        setMessage('Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.');

        // Tự động chuyển trang sau 5 giây (tuỳ chọn)
        setTimeout(() => {
            navigate('/login');
        }, 5000);

      } catch (error) {
        setStatus('error');
        // Lấy thông báo lỗi từ Backend (Token hết hạn, không tồn tại...)
        setMessage(error.response?.data?.message || 'Xác thực thất bại. Link có thể đã hết hạn.');
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        
        {/* TRẠNG THÁI: LOADING */}
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <FaSpinner className="text-blue-500 text-5xl animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Đang xử lý...</h2>
            <p className="text-gray-500 mt-2">{message}</p>
          </div>
        )}

        {/* TRẠNG THÁI: THÀNH CÔNG */}
        {status === 'success' && (
          <div className="flex flex-col items-center animate-fade-in">
            <FaCheckCircle className="text-green-500 text-6xl mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Thành công!</h2>
            <p className="text-gray-600 mt-2 mb-6">{message}</p>
            
            <Link 
              to="/login" 
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
            >
              Đăng nhập ngay
            </Link>
            <p className="text-xs text-gray-400 mt-4">Tự động chuyển trang sau 5 giây...</p>
          </div>
        )}

        {/* TRẠNG THÁI: LỖI */}
        {status === 'error' && (
          <div className="flex flex-col items-center animate-fade-in">
            <FaTimesCircle className="text-red-500 text-6xl mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Xác thực thất bại</h2>
            <p className="text-red-600 mt-2 mb-6">{message}</p>
            
            <div className="flex gap-4">
                <Link 
                to="/login" 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                Quay lại Đăng nhập
                </Link>
                {/* Có thể thêm nút "Gửi lại mail" ở đây sau này */}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmailPage;