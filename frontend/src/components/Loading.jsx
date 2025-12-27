import React from 'react';
import { FaSpinner } from 'react-icons/fa';

/**
 * Component hiển thị trạng thái đang tải
 * @param {boolean} fullScreen - Nếu true: Hiển thị đè lên toàn bộ màn hình (Overlay)
 * @param {string} text - Dòng chữ hiển thị bên dưới spinner (Mặc định: "Đang tải...")
 */
const Loading = ({ fullScreen = false, text = "Đang tải..." }) => {
  
  // 1. Trường hợp Full Screen (Dùng khi F5 trang, hoặc chờ xử lý Login)
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center animate-fade-in">
          <FaSpinner className="text-blue-600 text-4xl animate-spin" />
          {text && (
            <p className="mt-4 text-gray-700 font-medium text-sm tracking-wide">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 2. Trường hợp Inline (Dùng khi load một phần nhỏ của trang)
  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full">
      <FaSpinner className="text-blue-600 text-3xl animate-spin" />
    </div>
  );
};

export default Loading;