import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaArrowLeft, FaExclamationTriangle, FaBan, FaSearch, FaServer } from 'react-icons/fa';

/**
 * Trang hiển thị lỗi chung cho toàn hệ thống
 * @param {number} status - Mã lỗi (403, 404, 500)
 * @param {string} title - Tiêu đề tùy chỉnh (optional)
 * @param {string} message - Nội dung chi tiết (optional)
 */
const ErrorPage = ({ status = 404, title, message }) => {
    const navigate = useNavigate();

    // Cấu hình nội dung dựa trên status code
    const config = {
        403: {
            icon: <FaBan className="text-red-500 text-6xl mb-4" />,
            title: "Quyền truy cập bị từ chối",
            message: "Bạn không có quyền truy cập vào tài nguyên này. Vui lòng liên hệ chủ sở hữu hoặc quản trị viên.",
            bg: "bg-red-50"
        },
        404: {
            icon: <FaSearch className="text-blue-500 text-6xl mb-4" />,
            title: "Không tìm thấy trang",
            message: "Đường dẫn bạn truy cập không tồn tại hoặc đã bị xóa.",
            bg: "bg-blue-50"
        },
        500: {
            icon: <FaServer className="text-orange-500 text-6xl mb-4" />,
            title: "Lỗi máy chủ nội bộ",
            message: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.",
            bg: "bg-orange-50"
        },
        default: {
            icon: <FaExclamationTriangle className="text-gray-500 text-6xl mb-4" />,
            title: "Đã xảy ra lỗi",
            message: "Có lỗi không xác định xảy ra.",
            bg: "bg-gray-50"
        }
    };

    const currentConfig = config[status] || config.default;
    const displayTitle = title || currentConfig.title;
    const displayMessage = message || currentConfig.message;

    return (
        <div className={`min-h-screen w-full flex items-center justify-center p-4 ${currentConfig.bg}`}>
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in-up border border-gray-100">
                <div className="flex justify-center">
                    {currentConfig.icon}
                </div>

                <h1 className="text-4xl font-extrabold text-gray-800 mb-2 tracking-tight">
                    {status}
                </h1>

                <h2 className="text-xl font-bold text-gray-700 mb-3">
                    {displayTitle}
                </h2>

                <p className="text-gray-500 mb-8 leading-relaxed">
                    {displayMessage}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition active:scale-95"
                    >
                        <FaArrowLeft size={14} />
                        Quay lại
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition active:scale-95"
                    >
                        <FaHome size={16} />
                        Về trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;