import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, createSearchParams, useSearchParams } from 'react-router-dom';
import { 
    FaUserCircle, FaSignOutAlt, FaBars, FaSearch, FaSlidersH, FaUser, FaCog, 
    FaFolder, FaFileAlt, FaFilePdf, FaFileWord, FaFileImage, FaKey
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import fileService from '../services/fileService';
import AdvancedSearchForm from './AdvancedSearchForm';
import ChangePasswordModal from './ChangePasswordModal';
import { formatDateShort } from '../utils/format';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Hook lấy params từ URL

  // UI State
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search State
  const [keyword, setKeyword] = useState('');
  const [previewResults, setPreviewResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // 1. SYNC URL TO INPUT (Xử lý F5 reload)
  useEffect(() => {
    const urlKeyword = searchParams.get('keyword');
    
    // NẾU CÓ KEYWORD TRÊN URL -> GÁN VÀO INPUT
    if (urlKeyword) {
        setKeyword(urlKeyword);
    } 
    // NẾU KHÔNG CÓ (urlKeyword là null/undefined) -> XÓA TRẮNG INPUT
    else {
        setKeyword(''); 
    }
  }, [searchParams]);

  // 2. CLICK OUTSIDE
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowDropdown(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. DEBOUNCE SEARCH PREVIEW (Chỉ khi gõ ở Header)
  useEffect(() => {
    if (!keyword.trim()) {
        setPreviewResults([]);
        setShowDropdown(false);
        return;
    }

    // Nếu keyword khớp với URL (tức là đã Enter rồi) -> Không hiện preview nữa cho đỡ rối
    if (keyword === searchParams.get('keyword')) return;

    const timer = setTimeout(async () => {
        setIsSearching(true);
        try {
            // Preview chỉ search theo keyword thuần túy
            const res = await fileService.searchFiles({ keyword, page: 0, size: 5 });
            if (res.success) {
                setPreviewResults(res.data);
                setShowDropdown(true);
            }
        } catch (error) { console.error(error); } 
        finally { setIsSearching(false); }
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword, searchParams]);

  // 4. NAVIGATE & APPLY
  const goToSearchPage = (params) => {
      setShowDropdown(false);
      setShowAdvancedModal(false);
      
      // TÁCH BỎ DISPLAY NAME, KHÔNG ĐƯA LÊN URL
      const { ownerDisplayName, locationDisplayName, ...rawParams } = params;

      // Lọc bỏ params rỗng/null
      const cleanParams = Object.fromEntries(
        Object.entries(rawParams).filter(([_, v]) => v != null && v !== "" && v !== false)
      );

      navigate({
          pathname: '/search',
          search: `?${createSearchParams(cleanParams)}`,
      });
  };

  // Xử lý Enter tại Header (Chỉ tìm theo Keyword)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        goToSearchPage({ keyword });
    }
  };

  // Xử lý Apply từ Advanced Modal (Keyword + Params)
  const handleAdvancedApply = (data) => {
      // Data từ Modal đã bao gồm keyword và các filter khác
      goToSearchPage(data);
  };

  // Helper lấy params hiện tại để nạp vào Modal khi mở lên
  const getCurrentParams = () => {
      const current = Object.fromEntries([...searchParams]);
      // Convert string "true"/"false" về boolean cho checkbox
      if(current.inTrash === 'true') current.inTrash = true;
      else if(current.inTrash === 'false') current.inTrash = false;
      
      // Đảm bảo keyword trong modal khớp với input hiện tại (nếu user vừa sửa mà chưa enter)
      current.keyword = keyword; 
      return current;
  };

  const handleResultClick = (item) => {
    setShowDropdown(false); // Đóng dropdown trước

    if (item.type === 'FOLDER') {
        // Nếu là Folder -> Điều hướng vào trong
        navigate(`/folders/${item.id}`);
    } else {
        // Nếu là File
        navigate(`/file/view/${item.id}`);
    }
};

  // Icons Helper
  const getSmallIcon = (type, extension) => {
      if (type === 'FOLDER') return <FaFolder className="text-yellow-500" />;
      const ext = extension ? extension.toLowerCase() : '';
      if (ext === 'pdf') return <FaFilePdf className="text-red-500" />;
      if (['doc', 'docx'].includes(ext)) return <FaFileWord className="text-blue-500" />;
      if (['jpg', 'png'].includes(ext)) return <FaFileImage className="text-purple-500" />;
      return <FaFileAlt className="text-gray-400" />;
  };

  return (
    <header className="h-16 bg-white shadow-sm sticky top-0 z-40 flex items-center justify-between px-6">
        {/* Toggle & Logo */}
        <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded text-gray-600"><FaBars size={20}/></button>
            {/* Logo hoặc Breadcrumb nếu muốn */}
        </div>

        {/* SEARCH BAR AREA */}
        <div className="flex-1 max-w-3xl relative mx-4" ref={searchRef}>
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 border border-transparent focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm transition">
                <FaSearch className="text-gray-400 mr-3" />
                <input 
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-500"
                    placeholder="Tìm kiếm tài liệu, thư mục..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if(keyword.trim()) setShowDropdown(true); }}
                />
                <button 
                    onClick={() => setShowAdvancedModal(true)}
                    className="ml-2 p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition"
                    title="Tìm kiếm nâng cao"
                >
                    <FaSlidersH />
                </button>
            </div>

            {/* PREVIEW DROPDOWN */}
            {showDropdown && keyword.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in-down">
                    {isSearching ? (
                        <div className="p-4 text-center text-sm text-gray-500 flex justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            Đang tìm...
                        </div>
                    ) : (
                        <>
                            {previewResults.length > 0 ? (
                                <ul>
                                    {previewResults.map(item => (
                                        <li key={item.id} className="border-b last:border-none">
                                            {/* SỬA ĐỔI LAYOUT TẠI ĐÂY */}
                                            <div 
                                                onClick={() => handleResultClick(item)}
                                                className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition cursor-pointer group"
                                            >
                                                {/* --- BÊN TRÁI: Icon + Tên + Owner --- */}
                                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                    {/* Icon */}
                                                    <div className="text-xl shrink-0 text-gray-500">
                                                        {getSmallIcon(item.type, item.extension)}
                                                    </div>

                                                    {/* Info Wrapper */}
                                                    <div className="overflow-hidden flex flex-col">
                                                        {/* Tên File/Folder */}
                                                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-700" title={item.name}>
                                                            {item.name}
                                                        </p>
                                                        
                                                        {/* Người sở hữu */}
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                                                            <span className="opacity-75">Bởi:</span>
                                                            <span className="font-medium text-gray-600">
                                                                {item.ownerName || item.owner?.name || "Ẩn danh"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* --- BÊN PHẢI: Ngày cập nhật --- */}
                                                <div className="ml-4 whitespace-nowrap text-right">
                                                    <p className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                                                        {formatDateShort(item.updatedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    Không tìm thấy kết quả.
                                </div>
                            )}
                            
                            {/* Footer Dropdown */}
                            <div 
                                onClick={() => goToSearchPage({ keyword })} 
                                className="bg-gray-50 px-4 py-3 text-center text-sm text-blue-600 font-semibold cursor-pointer hover:bg-gray-100 border-t transition hover:underline"
                            >
                                Xem tất cả kết quả cho "{keyword}"
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>

        {/* USER MENU */}
        <div className="relative" ref={userMenuRef}>
             <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 hover:bg-gray-100 p-1.5 rounded-lg transition">
                 <div className="text-right hidden md:block">
                    <div className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">{user?.fullName || "User"}</div>
                    <div className="text-xs text-gray-500 max-w-[120px] truncate">{user?.username}</div>
                 </div>
                 {user?.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-300 object-cover" /> : <FaUserCircle className="text-gray-400 text-4xl" />}
             </button>
             {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-lg shadow-xl py-2 animate-fade-in-down z-50">
                    <div className="px-4 py-3 border-b bg-gray-50">
                        <p className="text-sm font-bold truncate">{user?.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50" onClick={() => setShowUserMenu(false)}>
                        <FaUser className="text-gray-400" /> <span>Thông tin tài khoản</span>
                    </Link>
                    
                    {/* --- NÚT ĐỔI MẬT KHẨU (MỚI) --- */}
                    <button 
                        onClick={() => {
                            setShowUserMenu(false); // Đóng menu
                            setShowChangePassword(true); // Mở modal
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition"
                    >
                        <FaKey className="text-gray-400" /> <span>Đổi mật khẩu</span>
                    </button>

                    <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50" onClick={() => setShowUserMenu(false)}>
                        <FaCog className="text-gray-400" /> <span>Cài đặt hệ thống</span>
                    </Link>
                    
                    <div className="border-t my-1"></div>
                    
                    <button onClick={() => { setShowUserMenu(false); logout(); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium">
                        <FaSignOutAlt /> <span>Đăng xuất</span>
                    </button>
                </div>
             )}
        </div>

        {/* MODAL ADVANCED SEARCH (RENDER TẠI ĐÂY) */}
        {showAdvancedModal && (
            <AdvancedSearchForm 
                initialValues={getCurrentParams()} 
                onClose={() => setShowAdvancedModal(false)}
                onApply={handleAdvancedApply}
            />
        )}

        {/* Modal Đổi mật khẩu (MỚI) */}
        {showChangePassword && (
            <ChangePasswordModal 
                onClose={() => setShowChangePassword(false)}
            />
        )}
    </header>
  );
};

export default Header;