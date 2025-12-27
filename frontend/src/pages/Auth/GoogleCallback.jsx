import React, { useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';

const GoogleCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithGoogle } = useContext(AuthContext);
  
  // useRef để chặn React.StrictMode gọi API 2 lần
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    // Hàm tách lấy params từ URL (ví dụ: ?code=... hoặc #id_token=...)
    const handleGoogleCallback = async () => {
      try {
        // 1. Lấy token/code từ URL
        // Lưu ý: Tùy cấu hình Google mà nó trả về Query Param (?code=) hoặc Hash (#id_token=)
        // Code dưới đây ví dụ cho trường hợp lấy idToken từ URL Hash (Implicit Flow)
        const hash = location.hash; 
        const params = new URLSearchParams(hash.replace('#', '?'));
        const idToken = params.get('id_token');

        if (idToken) {
          // 2. Gọi hàm login trong Context (Giống hệt lúc bấm nút Popup)
          // Chúng ta cần sửa hàm loginWithGoogle trong Context một chút để nhận string trực tiếp
          // Thay vì nhận object credentialResponse
          await loginWithGoogle({ credential: idToken }); 
        } else {
            // Trường hợp Redirect Flow trả về 'code' (Auth Code Flow)
            // Thì Backend phải hỗ trợ đổi code lấy token.
            // Hiện tại Backend ta đang nhận idToken nên ta tạm bỏ qua logic 'code'.
             toast.error("Không tìm thấy Google Token hợp lệ.");
             navigate('/login');
        }

      } catch (error) {
        console.error("Google Callback Error:", error);
        toast.error("Lỗi xác thực Google.");
        navigate('/login');
      }
    };

    handleGoogleCallback();
  }, [location, loginWithGoogle, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <FaSpinner className="text-blue-600 text-6xl animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-gray-700">Đang xử lý đăng nhập Google...</h2>
      <p className="text-gray-500">Vui lòng đợi trong giây lát.</p>
    </div>
  );
};

export default GoogleCallback;