import React, { useEffect, useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { 
  FaUser, FaEnvelope, FaCamera, FaCalendarAlt, FaUserTag, 
  FaShieldAlt, FaPen, FaSave, FaSpinner 
} from 'react-icons/fa';
import userService from '../../services/userService';
import { AuthContext } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';
import Loading from '../../components/Loading';

const ProfilePage = () => {
  const { updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const { ref: avatarRef, onChange: avatarOnChange, ...avatarRest } = register("avatar");

  // 1. Fetch Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userService.getProfile();
        if (res.success) {
          setProfile(res.data);
          setValue("fullName", res.data.fullName);
        }
      } catch (error) {
        toast.error("Không thể tải thông tin tài khoản");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [setValue]);

  // 2. Xử lý preview ảnh
  const handleImageChange = (e) => {
    // A. Logic preview của bạn
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
        return;
      }
      setPreviewImage(URL.createObjectURL(file));
    }

    // B. QUAN TRỌNG: Gọi hàm onChange của react-hook-form để nó cập nhật state 'data.avatar'
    avatarOnChange(e);
  };

  const handleCancel = () => {
      // 1. Khôi phục lại tên ban đầu
      setValue("fullName", profile?.fullName);
      
      // 2. Xóa ảnh preview (giao diện)
      setPreviewImage(null);

      // 3. QUAN TRỌNG: Xóa dữ liệu file trong bộ nhớ form
      setValue("avatar", null); 

      // 4. (Tuỳ chọn) Cuộn lên đầu trang
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3. Submit Form
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("fullName", data.fullName.trim());
      
      if (data.avatar && data.avatar.length > 0) {
        formData.append("avatar", data.avatar[0]);
      }

      const res = await userService.updateProfile(formData);
      
      if (res.success) {
        toast.success("Cập nhật hồ sơ thành công!");
        setProfile(res.data);
        updateUser({
            fullName: res.data.fullName,
            avatarUrl: res.data.avatarUrl
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 pb-10 animate-fade-in">
      
      {/* --- 1. HEADER COVER IMAGE --- */}
      {/* SỬA LỖI: Tăng chiều cao lên h-64 để thoáng hơn và đổi vị trí chữ */}
      <div className="h-56 bg-gradient-to-r from-blue-700 to-indigo-900 relative shadow-md overflow-hidden">
         {/* Decorative Circles */}
         <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-white rounded-full mix-blend-overlay blur-3xl opacity-10"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400 rounded-full mix-blend-overlay blur-3xl opacity-20"></div>
         </div>
         
         {/* SỬA LỖI: Dùng items-center để chữ nằm giữa chiều cao header, tránh bị nội dung bên dưới che */}
         <div className="container mx-auto px-4 h-full flex items-center">
             <div className="mb-8"> {/* Thêm margin bottom để đẩy chữ lên cao hơn chút nữa */}
                <h1 className="text-4xl font-bold text-white drop-shadow-lg tracking-wide">
                    Hồ sơ cá nhân
                </h1>
                <p className="text-blue-100 text-sm mt-1 opacity-90">Quản lý thông tin và cài đặt tài khoản của bạn</p>
             </div>
         </div>
      </div>

      {/* --- 2. MAIN CONTENT CONTAINER --- */}
      {/* Giữ nguyên margin âm để tạo hiệu ứng nổi, nhưng header đã đủ cao để không bị che chữ */}
      <div className="container mx-auto px-4 -mt-20 relative z-10 max-w-5xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-6">
            
            {/* --- LEFT COLUMN: IDENTITY CARD --- */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden text-center p-6 relative">
                    
                    {/* Avatar Upload */}
                    <div className="relative mx-auto w-36 h-36 -mt-1 mb-4 group">
                        <div className="w-full h-full rounded-full p-1.5 bg-white shadow-md">
                            <img 
                                src={previewImage || profile?.avatarUrl || "https://ui-avatars.com/api/?name=" + (profile?.username || "User") + "&background=random"} 
                                alt="Avatar" 
                                className="w-full h-full rounded-full object-cover border border-gray-200"
                            />
                        </div>
                        {/* Camera Overlay */}
                        <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition transform hover:scale-105 group-hover:ring-4 ring-blue-100 border-2 border-white">
                            <FaCamera size={14} />
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                
                                // 1. Spread các props còn lại (name, onBlur...)
                                {...avatarRest} 
                                
                                // 2. Gán ref đã tách
                                ref={avatarRef}
                                
                                // 3. Gán hàm onChange custom đã bao gồm cả logic form
                                onChange={handleImageChange}
                            />
                        </label>
                    </div>

                    <h2 className="text-xl font-bold text-gray-800 mb-1">{profile?.fullName || profile?.username}</h2>
                    <p className="text-sm text-gray-500 mb-4">{profile?.email}</p>

                    {/* Roles Badges */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {profile?.roles.map((role, index) => (
                            <span key={index} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full border border-indigo-100 flex items-center gap-1">
                                <FaShieldAlt size={10} /> {role}
                            </span>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-4 text-left space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 flex items-center gap-2"><FaUserTag className="text-gray-400"/> ID:</span>
                            <span className="font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded text-xs select-all">{profile?.id}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 flex items-center gap-2"><FaCalendarAlt className="text-gray-400"/> Tham gia:</span>
                            <span className="text-gray-700 font-medium">{formatDate(profile?.createdAt)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT COLUMN: EDIT FORM --- */}
            <div className="w-full md:w-2/3">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <FaPen size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Cập nhật thông tin</h3>
                            <p className="text-xs text-gray-500">Chỉnh sửa thông tin cá nhân của bạn</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        
                        {/* Section: Tài khoản */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thông tin tài khoản</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Username (Read Only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaUser className="text-gray-400 group-hover:text-gray-500" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={profile?.username || ''}
                                            readOnly
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-transparent rounded-lg text-gray-500 cursor-not-allowed text-sm focus:outline-none font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Email (Read Only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaEnvelope className="text-gray-400 group-hover:text-gray-500" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={profile?.email || ''}
                                            readOnly
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-transparent rounded-lg text-gray-500 cursor-not-allowed text-sm focus:outline-none font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Cá nhân */}
                        <div className="pt-2">
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thông tin cá nhân</h4>
                             
                             {/* Full Name */}
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Họ và tên <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    {...register("fullName", { required: "Họ tên không được để trống" })}
                                    placeholder="Nhập họ tên đầy đủ..."
                                    className={`w-full px-4 py-2.5 border rounded-lg text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition shadow-sm ${errors.fullName ? 'border-red-500 ring-1 ring-red-100' : 'border-gray-300'}`}
                                />
                                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                             </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 border-t mt-4 flex items-center justify-end gap-3">
                            <button 
                                type="button"
                                onClick={handleCancel}
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition"
                            >
                                Hủy bỏ
                            </button>
                            
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className={`px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl focus:ring-4 focus:ring-blue-200 transition transform active:scale-95 flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <FaSpinner className="animate-spin" /> Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <FaSave /> Lưu thay đổi
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;