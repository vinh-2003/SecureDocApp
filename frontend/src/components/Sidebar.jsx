import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    FaFolder, FaShareAlt, FaClock, FaTrash, FaCloudUploadAlt, 
    FaFolderPlus, FaFileUpload, FaFolderOpen, FaUserShield 
} from 'react-icons/fa';
import { FileContext } from '../context/FileContext';
import { toast } from 'react-toastify';

const Sidebar = () => {
  const { handleCreateFolder, handleUploadFile, handleUploadFolder, currentPermissions } = useContext(FileContext);
  
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // [MỚI] Lấy đường dẫn hiện tại
  const location = useLocation();

  // [LOGIC MỚI] Tính toán quyền hiển thị nút Tải lên
  // Chỉ cho phép tải lên nếu đang ở Root ('/') hoặc trong Folder ('/folders/...')
  // Các trang khác như /shared, /trash, /recent đều KHÔNG ĐƯỢC upload
  const isValidLocation = location.pathname === '/' || location.pathname.startsWith('/folders/');
  
  // Quyền thực tế = (Đúng vị trí) AND (Có quyền từ Context)
  const effectivePerms = {
      canCreateFolder: isValidLocation && currentPermissions.canCreateFolder,
      canUploadFile: isValidLocation && currentPermissions.canUploadFile,
      canUploadFolder: isValidLocation && currentPermissions.canUploadFolder
  };

  // Nút chính chỉ active nếu có ÍT NHẤT 1 hành động được phép
  const canDoAnything = effectivePerms.canCreateFolder || effectivePerms.canUploadFile || effectivePerms.canUploadFolder;

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUploadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLER: CREATE FOLDER ---
  const submitCreateFolder = async (e) => {
    e.preventDefault();
    if(!newFolderName.trim()) return;
    
    const success = await handleCreateFolder(newFolderName);
    if(success) {
        setShowCreateModal(false);
        setNewFolderName('');
    }
  };

  // --- HELPER: CHECK ĐỊNH DẠNG FILE ---
  const isAllowedFile = (file) => {
      const allowedExtensions = ['pdf', 'doc', 'docx'];
      const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      // 1. Check theo MIME Type (Chính xác hơn)
      if (allowedMimeTypes.includes(file.type)) return true;

      // 2. Check theo đuôi file (Dự phòng trường hợp Windows/Browser không nhận diện được MIME)
      const ext = file.name.split('.').pop().toLowerCase();
      return allowedExtensions.includes(ext);
  };

  // --- HANDLER: UPLOAD FILE ---
  const onFileSelect = async (e) => {
      const rawFiles = e.target.files; 
      if (!rawFiles || rawFiles.length === 0) return;

      const allFiles = Array.from(rawFiles);

      // Lọc file hợp lệ
      const validFiles = allFiles.filter(file => isAllowedFile(file));

      // Cảnh báo nếu có file bị loại
      if (validFiles.length < allFiles.length) {
          toast.warning(`Đã bỏ qua ${allFiles.length - validFiles.length} tệp không hỗ trợ (Chỉ chấp nhận PDF, Word).`);
      }
      
      if(validFiles.length > 0) {
          await handleUploadFile(validFiles); 
      }

      // Reset input và đóng menu
      e.target.value = null; 
      setShowUploadMenu(false);
  };

  const onFolderSelect = async (e) => {
      const rawFiles = e.target.files;
      if (!rawFiles || rawFiles.length === 0) return;

      const allFiles = Array.from(rawFiles);

      // Lọc file hợp lệ trong folder
      const validFiles = allFiles.filter(file => isAllowedFile(file));

      if (validFiles.length === 0) {
          toast.error("Thư mục không chứa tệp PDF hoặc Word nào.");
          e.target.value = null;
          setShowUploadMenu(false);
          return;
      }

      if (validFiles.length < allFiles.length) {
          toast.info(`Đang tải lên ${validFiles.length} tệp hợp lệ trong thư mục.`);
      }

      // Gọi hàm upload
      await handleUploadFolder(validFiles); 
      
      e.target.value = null;
      setShowUploadMenu(false);
  };

  // Helper render item trong dropdown (để tránh lặp code)
  const renderDropdownItem = (label, icon, onClick, canDo, isBorderTop = false) => (
      <button 
          onClick={() => {
              if (canDo) onClick();
          }}
          disabled={!canDo}
          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition
              ${isBorderTop ? 'border-t border-gray-100' : ''}
              ${canDo 
                  ? 'hover:bg-gray-100 cursor-pointer text-gray-800' 
                  : 'text-gray-400 cursor-not-allowed bg-gray-50' // Style khi bị disabled
              }
          `}
          title={!canDo ? "Bạn không có quyền thực hiện hành động này" : ""}
      >
          <span className={canDo ? "" : "opacity-50"}>{icon}</span>
          <span>{label}</span>
      </button>
  );

  const menus = [
    { path: '/', name: 'Tài liệu của tôi', icon: <FaFolder /> },
    { path: '/shared', name: 'Được chia sẻ', icon: <FaShareAlt /> },
    { path: '/requests', name: 'Yêu cầu truy cập', icon: <FaUserShield /> }, // <--- Thêm dòng này
    { path: '/recent', name: 'Gần đây', icon: <FaClock /> },
    { path: '/trash', name: 'Thùng rác', icon: <FaTrash /> },
];

  return (
    <>
        <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col transition-all duration-300 relative">
        <div onClick={() => window.location.href = '/'} className="h-16 flex items-center justify-center border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition">
            <h1 className="text-2xl font-bold text-blue-400">SecureDoc</h1>
        </div>

        {/* NÚT TẢI LÊN + DROPDOWN */}
        <div className="p-4 relative" ref={menuRef}>
            <button 
                onClick={() => {
                    // Chỉ mở menu nếu có ít nhất 1 quyền
                    if (canDoAnything) setShowUploadMenu(!showUploadMenu);
                }}
                disabled={!canDoAnything} // Disable nút to nếu không làm được gì
                className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition shadow-lg
                    ${canDoAnything 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-70' // Style nút to khi disable
                    }
                `}
            >
                <FaCloudUploadAlt size={20} />
                <span>Tải lên mới</span>
            </button>

            {/* Dropdown Menu */}
            {showUploadMenu && canDoAnything && (
                <div className="absolute left-4 right-4 top-16 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in overflow-hidden">
                    
                    {/* Thư mục mới */}
                    {renderDropdownItem(
                        'Thư mục mới',
                        <FaFolderPlus className={effectivePerms.canCreateFolder ? "text-yellow-500" : "text-gray-400"} />,
                        () => { setShowCreateModal(true); setShowUploadMenu(false); },
                        effectivePerms.canCreateFolder
                    )}
                    
                    {/* Tải tệp lên */}
                    {renderDropdownItem(
                        'Tải tệp lên',
                        <FaFileUpload className={effectivePerms.canUploadFile ? "text-blue-500" : "text-gray-400"} />,
                        () => fileInputRef.current.click(),
                        effectivePerms.canUploadFile,
                        true // borderTop
                    )}
                    
                    {/* Tải thư mục lên */}
                    {renderDropdownItem(
                        'Tải thư mục lên',
                        <FaFolderOpen className={effectivePerms.canUploadFolder ? "text-gray-500" : "text-gray-400"} />,
                        () => folderInputRef.current.click(),
                        effectivePerms.canUploadFolder,
                        true // borderTop
                    )}
                </div>
            )}

            {/* Inputs ẩn giữ nguyên */}
            <input 
                type="file" multiple className="hidden" 
                ref={fileInputRef} onChange={onFileSelect}
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            <input 
                type="file" className="hidden" ref={folderInputRef} 
                onChange={onFolderSelect} webkitdirectory="" directory="" multiple 
            />
        </div>

        {/* Navigation Links giữ nguyên */}
        <nav className="flex-1 px-2 space-y-1">
            {menus.map((item) => (
            <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    isActive ? 'bg-gray-800 text-blue-400 border-l-4 border-blue-500' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
                }
            >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
            </NavLink>
            ))}
        </nav>
        </div>

        {/* MODAL TẠO THƯ MỤC */}
        {showCreateModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-xl p-6 w-96 animate-fade-in-down">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Tạo thư mục mới</h3>
                    <form onSubmit={submitCreateFolder}>
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                            placeholder="Nhập tên thư mục..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition"
                            >
                                Hủy
                            </button>
                            <button 
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            >
                                Tạo
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>
  );
};

export default Sidebar;