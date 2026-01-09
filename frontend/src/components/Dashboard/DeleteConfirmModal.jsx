// src/components/Dashboard/DeleteConfirmModal.jsx
import React from 'react';
import { FaTrashAlt, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const DeleteConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    count = 1, 
    isPermanent = false, // True = Xóa vĩnh viễn, False = Thùng rác
    isLoading = false 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-fade-in-down border border-gray-100">
                
                {/* Header Icon */}
                <div className="flex flex-col items-center pt-8 pb-4 px-6 text-center">
                    <div className={`p-4 rounded-full mb-4 shadow-inner ${isPermanent ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-500'}`}>
                        {isPermanent ? <FaExclamationTriangle size={32} /> : <FaTrashAlt size={32} />}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800">
                        {isPermanent ? 'Xóa vĩnh viễn?' : 'Chuyển vào thùng rác?'}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                        Bạn có chắc chắn muốn xóa <strong className="text-gray-800">{count} mục</strong> đã chọn không?
                        {isPermanent 
                            ? <span className="block text-red-500 mt-1 font-medium">Hành động này không thể hoàn tác!</span> 
                            : <span className="block mt-1">Các mục này sẽ được lưu trong thùng rác 30 ngày.</span>
                        }
                    </p>
                </div>

                {/* Footer Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition disabled:opacity-50 shadow-sm"
                    >
                        Huỷ bỏ
                    </button>
                    
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium shadow-md transition disabled:opacity-70 flex items-center justify-center gap-2
                            ${isPermanent 
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-200' 
                                : 'bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:ring-orange-200'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Đang xoá...</span>
                            </>
                        ) : (
                            <>
                                <FaTrashAlt size={14} />
                                <span>{isPermanent ? 'Xóa ngay' : 'Xóa'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;