import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaFolder, FaShareAlt, FaClock, FaTrash, FaCloudUploadAlt, FaFolderPlus, FaFileUpload, FaFolderOpen } from 'react-icons/fa';
import { FileContext } from '../context/FileContext';
// import { toast } from 'react-toastify';

const Sidebar = () => {
  const { handleCreateFolder, handleUploadFile, handleUploadFolder } = useContext(FileContext);
  
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

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

  // --- HANDLER: UPLOAD FILE ---
  const onFileSelect = async (e) => {
      // TỐI ƯU: Lấy toàn bộ FileList thay vì chỉ lấy files[0]
      const files = e.target.files; 
      
      if(files && files.length > 0) {
          // Truyền cả danh sách sang Context để xử lý Batch Upload
          await handleUploadFile(files); 
          
          // Reset input
          e.target.value = null; 
      }
      setShowUploadMenu(false);
  };

  const onFolderSelect = async (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          await handleUploadFolder(files); // Gọi hàm mới
          e.target.value = null;
      }
      setShowUploadMenu(false);
  };

  const menus = [
    { path: '/', name: 'Tài liệu của tôi', icon: <FaFolder /> },
    { path: '/shared', name: 'Được chia sẻ', icon: <FaShareAlt /> },
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
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition shadow-lg"
            >
                <FaCloudUploadAlt size={20} />
                <span>Tải lên mới</span>
            </button>

            {/* Dropdown Menu */}
            {showUploadMenu && (
                <div className="absolute left-4 right-4 top-16 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in overflow-hidden">
                    <button 
                        onClick={() => { setShowCreateModal(true); setShowUploadMenu(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 transition"
                    >
                        <FaFolderPlus className="text-yellow-500" /> Thư mục mới
                    </button>
                    
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 transition border-t border-gray-100"
                    >
                        <FaFileUpload className="text-blue-500" /> Tải tệp lên
                    </button>
                    
                    <button 
                        onClick={() => { folderInputRef.current.click(); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 transition border-t border-gray-100 text-gray-500"
                    >
                        <FaFolderOpen /> Tải thư mục lên
                    </button>
                </div>
            )}

            {/* Hidden Input File */}
            <input 
                type="file" 
                multiple
                className="hidden" 
                ref={fileInputRef} 
                onChange={onFileSelect}
            />
            {/* Thêm Input ẩn dành riêng cho Folder */}
            <input 
                type="file"
                className="hidden"
                ref={folderInputRef}
                onChange={onFolderSelect}
                webkitdirectory=""  // Quan trọng: Cho phép chọn folder (Chrome/Edge)
                directory=""        // Quan trọng: Fallback cho Firefox cũ
                multiple            // Bắt buộc
            />
        </div>

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