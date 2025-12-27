import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaTimes, FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import userService from '../services/userService';

const ChangePasswordModal = ({ onClose }) => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  
  // State để toggle hiện/ẩn mật khẩu
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    try {
      const res = await userService.changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
      });
      
      if (res.success) {
        toast.success("Đổi mật khẩu thành công!");
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.");
    }
  };

  // Helper render input field
  const renderInput = (label, name, showState, setShowState, validation) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
            </div>
            <input 
                type={showState ? "text" : "password"}
                {...register(name, validation)}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="••••••"
            />
            <button 
                type="button"
                onClick={() => setShowState(!showState)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
                {showState ? <FaEyeSlash /> : <FaEye />}
            </button>
        </div>
        {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name].message}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4 animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800">Đổi mật khẩu</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition"><FaTimes size={20} /></button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                
                {renderInput("Mật khẩu hiện tại", "currentPassword", showCurrent, setShowCurrent, { 
                    required: "Vui lòng nhập mật khẩu hiện tại" 
                })}

                {renderInput("Mật khẩu mới", "newPassword", showNew, setShowNew, { 
                    required: "Vui lòng nhập mật khẩu mới",
                    minLength: { value: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }
                })}

                {renderInput("Xác nhận mật khẩu mới", "confirmPassword", showConfirm, setShowConfirm, { 
                    required: "Vui lòng xác nhận mật khẩu",
                    validate: value => value === newPassword || "Mật khẩu xác nhận không khớp"
                })}

                <div className="flex justify-end gap-3 mt-6">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className={`px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition transform active:scale-95 flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default ChangePasswordModal;