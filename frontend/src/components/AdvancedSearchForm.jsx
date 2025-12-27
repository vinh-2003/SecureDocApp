import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaUserCheck, FaExclamationCircle, FaSpinner, FaTimes, FaUserCircle } from 'react-icons/fa';
import fileService from '../services/fileService';
import userService from '../services/userService';

const AdvancedSearchForm = ({ onClose, onApply, initialValues }) => {
  const { register, handleSubmit, setValue, reset, getValues } = useForm({
    defaultValues: initialValues || {
        keyword: "", // Thêm trường keyword
        fileType: "",
        ownerId: "",
        fromDate: "",
        toDate: "",
        locationId: "",
        inTrash: false
    }
  });

  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // State User Search
  const [searchEmail, setSearchEmail] = useState(initialValues?.ownerDisplayName || "");
  const [foundUser, setFoundUser] = useState(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userError, setUserError] = useState("");
  const [isRestoringUser, setIsRestoringUser] = useState(false);

  // 1. LOAD FOLDERS (Giữ nguyên)
  useEffect(() => {
    const loadFolders = async () => {
        setLoadingFolders(true);
        try {
            const res = await fileService.getAllUserFolders();
            if(res.success && Array.isArray(res.data)) {
                setFolders(res.data);
                if (initialValues?.locationId) setValue("locationId", initialValues.locationId);
            }
        } catch (error) { console.error(error); } 
        finally { setLoadingFolders(false); }
    };
    loadFolders();
  }, [initialValues, setValue]);

  // ==========================================================
  // 2. KHÔI PHỤC USER TỪ ID (THÊM MỚI ĐOẠN NÀY)
  // ==========================================================
  useEffect(() => {
      // Lấy ID hiện tại đang lưu trong form
      const currentFormId = getValues("ownerId");

      // Chỉ chạy khôi phục nếu:
      // 1. Có initial ID
      // 2. Chưa có data hiển thị (foundUser/searchEmail)
      // 3. QUAN TRỌNG: ID trong form vẫn khớp với Initial ID (Nghĩa là user CHƯA xóa nó)
      if (initialValues?.ownerId && !foundUser && !searchEmail && currentFormId === initialValues.ownerId) {
          
          const restoreUser = async () => {
              setIsRestoringUser(true);
              try {
                  const res = await userService.getUserById(initialValues.ownerId);
                  if (res.success) {
                      const user = res.data;
                      setFoundUser(user);
                      setSearchEmail(user.email); 
                      setValue("ownerId", user.id);
                  }
              } catch (error) {
                  console.error("Lỗi khôi phục user:", error);
                  setSearchEmail(initialValues.ownerId); // Fallback hiện ID
              } finally {
                  setIsRestoringUser(false);
              }
          };
          restoreUser();
      }
      
  // Đã thêm đầy đủ dependencies theo yêu cầu của ESLint
  }, [initialValues, foundUser, searchEmail, setValue, getValues]);


  // 3. SEARCH USER LOGIC KHI GÕ (SỬA LẠI CHÚT ĐỂ TRÁNH CONFLICT)
  useEffect(() => {
      // Nếu đang khôi phục dữ liệu thì không chạy search debounce
      if (isRestoringUser) return;

      if(!searchEmail.trim()) {
          // Nếu người dùng xóa hết chữ -> Reset user
          setFoundUser(null);
          setUserError("");
          setValue("ownerId", "");
          return;
      }

      // Nếu email trong ô input TRÙNG KHỚP với user đã tìm thấy -> Không search lại
      if (foundUser && searchEmail === foundUser.email) return;

      const timer = setTimeout(async () => {
          setIsSearchingUser(true);
          setUserError("");
          try {
              const res = await userService.findUserByEmail(searchEmail);
              if(res.success) {
                  setFoundUser(res.data);
                  setValue("ownerId", res.data.id);
              }
          } catch (error) {
              setFoundUser(null);
              setValue("ownerId", "");
              setUserError("Không tìm thấy user");
          } finally { setIsSearchingUser(false); }
      }, 600);
      return () => clearTimeout(timer);
  }, [searchEmail, setValue, foundUser, isRestoringUser]);

  // 3. RENDER TREE FOLDER (Giữ nguyên)
  const renderFolderOptions = (parentId = null, level = 0) => {
      const children = folders.filter(f => (!parentId ? !f.parentId : f.parentId === parentId));
      if(children.length === 0) return null;
      return children.map(folder => (
          <React.Fragment key={folder.id}>
              <option value={folder.id}>{'\u00A0'.repeat(level * 4)}{level > 0 ? '└─ ' : ''}{folder.name}</option>
              {renderFolderOptions(folder.id, level + 1)}
          </React.Fragment>
      ));
  };

  // 4. SUBMIT
  const onSubmit = (data) => {
    let folderName = "";
    if (data.locationId) {
        const selectedFolder = folders.find(f => f.id === data.locationId);
        folderName = selectedFolder ? selectedFolder.name : data.locationId;
    }

    const ownerNameDisplay = foundUser ? (foundUser.fullName || foundUser.username) : (searchEmail || "");

    const searchRequest = {
        keyword: data.keyword, // Lấy keyword từ form
        fileType: data.fileType,
        ownerId: data.ownerId,
        fromDate: data.fromDate,
        toDate: data.toDate,
        locationId: data.locationId,
        inTrash: data.inTrash || false,
        ownerDisplayName: ownerNameDisplay,
        locationDisplayName: folderName
    };
    
    onApply(searchRequest);
    onClose();
  };

  const handleReset = () => {
    reset({ keyword: "", fileType: "", ownerId: "", fromDate: "", toDate: "", locationId: "", inTrash: false });
    setSearchEmail("");
    setFoundUser(null);
  };

  return (
    // --- MODAL OVERLAY ---
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800">Tìm kiếm nâng cao</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition"><FaTimes size={20} /></button>
            </div>
      
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                
                {/* 1. KEYWORD (MỚI) */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Từ khóa</label>
                    <input 
                        {...register("keyword")} 
                        placeholder="Nhập tên file, nội dung..." 
                        autoFocus
                        className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                    />
                </div>

                {/* 2. Loại file & Folder */}
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Loại tài liệu</label>
                        <select {...register("fileType")} className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                            <option value="">Tất cả</option>
                            <option value="FOLDER">Thư mục</option>
                            <option value="pdf">PDF (.pdf)</option>
                            <option value="docx">Word (.docx)</option>
                            <option value="xlsx">Excel (.xlsx)</option>
                            <option value="jpg">Ảnh (.jpg)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Trong thư mục</label>
                        <select {...register("locationId")} className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" disabled={loadingFolders}>
                            <option value="">-- Tất cả (Gốc) --</option>
                            {!loadingFolders && renderFolderOptions(null, 0)}
                        </select>
                    </div>
                </div>

                {/* 3. Owner Search */}
                <div className="border p-4 rounded-lg bg-gray-50">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Người tạo (Email)</label>
                    <div className="relative">
                        <input 
                            type="text" placeholder="Nhập email người dùng..." 
                            className={`w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 pr-8 ${userError ? 'border-red-500' : ''}`}
                            value={searchEmail} 
                            onChange={(e) => setSearchEmail(e.target.value)}
                            disabled={isRestoringUser}
                        />
                        <input type="hidden" {...register("ownerId")} />
                        {/* Hiển thị Spinner khi đang search HOẶC đang khôi phục */}
                        {(isSearchingUser || isRestoringUser) && (
                            <div className="absolute right-3 top-2.5 text-gray-400 animate-spin"><FaSpinner /></div>
                        )}
                    </div>
                    {userError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><FaExclamationCircle /> {userError}</p>}
                    {foundUser && (
                        <div className="mt-2 flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
                            {/* <img src={foundUser.avatarUrl || "https://via.placeholder.com/30"} alt="Avatar" className="w-8 h-8 rounded-full border" /> */}
                            {foundUser.avatarUrl ? (
                                <img
                                    src={foundUser.avatarUrl}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full border"
                                />
                            ) : (
                                <FaUserCircle className="w-8 h-8 text-gray-400 rounded-full border" />
                            )}
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold text-gray-800 truncate">{foundUser.fullName || foundUser.username}</p>
                                <p className="text-xs text-gray-500 truncate">{foundUser.email}</p>
                            </div>
                            <FaUserCheck className="text-green-500" />
                            {/* Nút xóa user đã chọn */}
                            <button type="button" onClick={() => {
                                setFoundUser(null);
                                setSearchEmail("");
                                setValue("ownerId", "");
                            }} className="text-gray-400 hover:text-red-500 p-1">
                                <FaTimes />
                            </button>
                        </div>
                    )}
                </div>

                {/* 4. Date & Trash */}
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
                        <input type="date" {...register("fromDate")} className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
                        <input type="date" {...register("toDate")} className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="inTrash" {...register("inTrash")} className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    <label htmlFor="inTrash" className="text-sm text-gray-700 cursor-pointer select-none">Tìm trong thùng rác</label>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                    <button type="button" onClick={handleReset} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded border border-gray-300 transition">Đặt lại</button>
                    <button type="submit" className="px-6 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-lg transition transform hover:-translate-y-0.5">Áp dụng</button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default AdvancedSearchForm;