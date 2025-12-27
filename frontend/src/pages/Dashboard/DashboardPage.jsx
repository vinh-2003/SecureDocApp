import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Icon
import { 
  FaFolder, FaFileAlt, FaFilePdf, FaFileWord, FaFileImage, 
  FaHdd, FaLayerGroup, FaList, FaThLarge, FaChevronRight, FaHome,
  FaFolderPlus, FaFileUpload, FaFolderOpen,
  FaEllipsisV, FaDownload, FaPen, FaInfoCircle, FaShareAlt, 
  FaLink, FaArrowsAlt, FaTrash, FaClone,
  FaTimes, FaUserCircle, FaGlobeAsia, FaLock,
  FaUserPlus, FaCaretDown, FaExclamationTriangle
} from 'react-icons/fa';

// Components & Services
import fileService from '../../services/fileService';
import { FileContext } from '../../context/FileContext';
import { formatBytes, formatDate } from '../../utils/format';
import Loading from '../../components/Loading';

const DashboardPage = () => {
  // 1. LẤY PARAMS TỪ URL & ROUTER
  const { folderId } = useParams(); // Nếu ở trang chủ thì folderId là undefined
  const navigate = useNavigate();

  // 2. LẤY CONTEXT (Để đồng bộ với Sidebar & dùng chung logic Create/Upload)
  const { 
    setCurrentFolder, 
    refreshKey, 
    handleCreateFolder, 
    handleUploadFile,
    handleUploadFolder,
    handleRename,
    handleUpdateDescription
  } = useContext(FileContext);

  // 3. LOCAL STATE
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ totalFiles: 0, totalSize: 0 });
  const [loading, setLoading] = useState(false);
  
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Thư mục gốc' }]);
  const [sortConfig, setSortConfig] = useState({ sortBy: 'createdAt', direction: 'desc' });
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // State cho Context Menu (Chuột phải)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [itemMenu, setItemMenu] = useState({ visible: false, x: 0, y: 0, file: null });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // --- THÊM STATE CHO RENAME MODAL ---
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameData, setRenameData] = useState({ item: null, newName: '' });

  // --- THÊM STATE CHO DESCRIPTION MODAL ---
  const [showDescModal, setShowDescModal] = useState(false);
  const [descData, setDescData] = useState({ item: null, description: '' });

  // --- THÊM STATE CHO INFO MODAL ---
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoData, setInfoData] = useState(null); // Lưu dữ liệu từ API
  const [infoLoading, setInfoLoading] = useState(false);

  // --- STATE CHO SHARE MODAL ---
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState(null); // Lưu chi tiết file đang share
  const [shareLoading, setShareLoading] = useState(false);
  
  // State cho form thêm người
  const [emailInput, setEmailInput] = useState('');
  const [permissionInput, setPermissionInput] = useState('VIEWER'); // Default

  // --- STATE CHO MODAL XÁC NHẬN XÓA QUYỀN ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToRevoke, setUserToRevoke] = useState(null); // Lưu email người cần xóa
  const [revokeLoading, setRevokeLoading] = useState(false); // Loading cho nút xóa

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const renameInputRef = useRef(null);
  const descInputRef = useRef(null);

  // --- CONSTANTS: Ước lượng kích thước Menu ---
  const MENU_WIDTH = 260;  // Tương đương w-64 (256px) + padding
  const MENU_HEIGHT = 380; // Ước lượng chiều cao tối đa (File có nhiều option nhất)

  // --- USE EFFECT: CHẠY KHI URL HOẶC REFRESH KEY THAY ĐỔI ---
  useEffect(() => {
    // A. Sync với Context để Sidebar biết đang ở folder nào
    setCurrentFolder(folderId || null);

    // B. Tải dữ liệu
    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, refreshKey, sortConfig]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Gọi API lấy danh sách file (Root hoặc Folder con)
      const currentId = folderId || null;
      const filesRes = await fileService.getFiles(currentId, sortConfig.sortBy, sortConfig.direction);
      
      if (filesRes.success) {
        setFiles(filesRes.data);
      }

      // 2. Xử lý Logic riêng cho Root hoặc Folder con
      if (!currentId) {
        // --- ĐANG Ở ROOT ---
        // Lấy thống kê Dashboard
        const statsRes = await fileService.getDashboardStats();
        if (statsRes.success) setStats(statsRes.data);
        
        // Reset Breadcrumb
        setBreadcrumbs([{ id: null, name: 'Thư mục gốc' }]);
      } else {
        // --- ĐANG Ở FOLDER CON ---
        // Gọi API lấy chuỗi Breadcrumb từ Server (để fix lỗi F5 mất đường dẫn)
        const breadRes = await fileService.getBreadcrumbs(currentId);
        if (breadRes.success) {
            // Backend trả về list [Cha, Con, Cháu]. Nối vào sau "Thư mục gốc"
            setBreadcrumbs([
                { id: null, name: 'Thư mục gốc' },
                ...breadRes.data
            ]);
        }
      }
    } catch (error) {
      console.error("Load data error:", error);
      toast.error("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: ĐIỀU HƯỚNG (NAVIGATION) ---
  
  // Nhấn đúp vào file/folder
  const handleDoubleClick = (file) => {
    if (file.type === 'FOLDER') {
      // Chuyển hướng URL -> useEffect sẽ tự chạy lại để load data mới
      navigate(`/folders/${file.id}`);
    } else {
      handlePreview(file);
      // Logic xem/tải file ở đây (gọi API download inline)
    }
  };

  // Nhấn vào thanh Breadcrumb
  const handleBreadcrumbClick = (item) => {
    if (!item.id) {
      navigate('/'); // Về gốc
    } else {
      navigate(`/folders/${item.id}`); // Về folder cha
    }
  };

  // --- 1. HÀM XỬ LÝ TẢI XUỐNG ---
  const handleDownload = async (file) => {
    const toastId = toast.loading(`Đang chuẩn bị tải: ${file.name}...`);
    try {
      // Gọi API với inline = false
      const response = await fileService.downloadFile(file.id, false);
      
      // Tạo URL ảo từ Blob dữ liệu
      const url = window.URL.createObjectURL(new Blob([response]));
      
      // Tạo thẻ A ảo để kích hoạt tải xuống
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name); // Đặt tên file khi tải về
      document.body.appendChild(link);
      link.click();
      
      // Dọn dẹp
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss(toastId);
      toast.success("Đã tải xuống thành công!");
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Lỗi khi tải file. Có thể file đã bị xóa hoặc không có quyền.");
    }
  };

  // --- 2. HÀM XỬ LÝ XEM FILE (PREVIEW) ---
  const handlePreview = async (file) => {
    // Chỉ hỗ trợ xem nhanh các file trình duyệt đọc được
    const supportedTypes = ['image', 'pdf', 'text', 'audio', 'video'];
    const isSupported = supportedTypes.some(type => file.mimeType?.includes(type));

    if (!isSupported) {
       // Nếu không hỗ trợ xem thì chuyển sang tải xuống
       toast.info("Định dạng này không hỗ trợ xem trước. Đang tải xuống...");
       handleDownload(file);
       return;
    }

    const toastId = toast.loading("Đang mở tài liệu...");
    try {
       // Gọi API với inline = true
       const response = await fileService.downloadFile(file.id, true);

       // Tạo Blob URL
       // Lưu ý: response của axios trả về Blob trực tiếp nhờ config responseType: 'blob'
       // Nhưng đôi khi nó nằm trong response.data tuỳ cấu hình axiosClient. 
       // Nếu axiosClient của bạn trả về response.data, hãy dùng: new Blob([response])
       const fileBlob = new Blob([response], { type: file.mimeType });
       const fileUrl = URL.createObjectURL(fileBlob);

       // Mở trong Tab mới để xem
       window.open(fileUrl, '_blank');
       
       // Lưu ý: Với cách mở tab mới này, URL sẽ bị thu hồi khi tắt tab hoặc reload trang 
       // (Browser tự dọn dẹp Blob URL gắn với window)
       
       toast.dismiss(toastId);
    } catch (error) {
       toast.dismiss(toastId);
       toast.error("Không thể xem file này.");
    }
  };

  // --- HANDLERS: BACKGROUND CONTEXT MENU (Chuột phải vùng trống) ---
  const handleContextMenu = (e) => {
    e.preventDefault();
    // Đóng item menu nếu đang mở
    setItemMenu({ ...itemMenu, visible: false });
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY });
  };

  // --- HANDLERS: ITEM MENU (Dấu 3 chấm & Chuột phải vào item) ---
  
  // 1. Click dấu 3 chấm
  const handleThreeDotsClick = (e, file) => {
    e.stopPropagation(); 
    const rect = e.currentTarget.getBoundingClientRect();
    
    // 1. Tính toán X (Ngang)
    // Mặc định hiển thị lệch sang trái nút bấm một chút
    let x = rect.left - 150; 
    
    // Nếu menu bị tràn ra mép phải màn hình -> Căn lề phải của menu bằng lề phải của nút 3 chấm
    if (rect.left + MENU_WIDTH > window.innerWidth) {
        x = rect.right - MENU_WIDTH;
    }

    // 2. Tính toán Y (Dọc)
    let y = rect.bottom; // Mặc định hiện xuống dưới nút bấm

    // Nếu menu bị tràn xuống dưới đáy màn hình -> Cho hiện lên trên nút bấm
    if (y + MENU_HEIGHT > window.innerHeight) {
        y = rect.top - MENU_HEIGHT;
    }

    setItemMenu({
        visible: true,
        x: x,
        y: y,
        file: file
    });
    setContextMenu({ ...contextMenu, visible: false });
  };

  // 2. Chuột phải vào Item (File/Folder)
  const handleItemContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();

    let x = e.pageX;
    let y = e.pageY;

    // 1. Kiểm tra tràn ngang (Right edge)
    // Nếu vị trí chuột + chiều rộng menu > chiều rộng màn hình -> Hiển thị menu sang bên trái con chuột
    if (x + MENU_WIDTH > window.innerWidth) {
        x = x - MENU_WIDTH;
    }

    // 2. Kiểm tra tràn dọc (Bottom edge)
    // Nếu vị trí chuột + chiều cao menu > chiều cao màn hình -> Hiển thị menu lên trên con chuột
    if (y + MENU_HEIGHT > window.innerHeight) {
        y = y - MENU_HEIGHT;
    }

    setItemMenu({
        visible: true,
        x: x,
        y: y,
        file: file
    });
    setContextMenu({ ...contextMenu, visible: false });
  };

  // --- HÀM MỞ MODAL SHARE ---
  const openShareModal = async (file) => {
    setShowShareModal(true);
    setShareLoading(true);
    try {
        // Dùng lại API getFileDetails để lấy full danh sách quyền
        const res = await fileService.getFileDetails(file.id);
        if (res.success) {
            setShareData(res.data);
        }
    } catch (error) {
        toast.error("Lỗi tải thông tin chia sẻ.");
        setShowShareModal(false);
    } finally {
        setShareLoading(false);
    }
  };

  // 3. Xử lý hành động khi chọn menu
  const handleMenuAction = (action, file) => {
    setItemMenu({ ...itemMenu, visible: false }); // Đóng menu sau khi chọn
    
    switch (action) {
        case 'DOWNLOAD':
            // GỌI HÀM DOWNLOAD
            handleDownload(file);
            break;
        case 'RENAME':
            // Set dữ liệu ban đầu cho Modal
            setRenameData({ 
                item: file, 
                newName: file.name 
            });
            setShowRenameModal(true);
            break;
        case 'UPDATE_DESC':
            setDescData({ 
                item: file, 
                description: file.description || '' // Lấy mô tả hiện tại
            });
            setShowDescModal(true);
            break;
        case 'SHARE':
            openShareModal(file); // <--- Gọi hàm này
            break;
        case 'COPY_LINK':
            navigator.clipboard.writeText(`http://localhost:3000/share/${file.id}`);
            toast.success("Đã sao chép liên kết!");
            break;
        case 'MOVE':
            toast.info(`Di chuyển: ${file.name}`);
            break;
        case 'INFO':
            fetchFileInfo(file); // <--- GỌI HÀM NÀY
            break;
        case 'TRASH':
            toast.warn(`Đã chuyển vào thùng rác: ${file.name}`);
            // TODO: Gọi API soft delete
            break;
        case 'COPY': // Chỉ cho file
            toast.info(`Tạo bản sao: ${file.name}`);
            break;
        default:
            break;
    }
  };

  // Click ra ngoài để đóng TẤT CẢ menu
  useEffect(() => {
    const handleClick = () => {
        setContextMenu({ ...contextMenu, visible: false });
        setItemMenu({ ...itemMenu, visible: false });
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenu, itemMenu]);

  useEffect(() => {
    if (showRenameModal && renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select(); // Bôi đen toàn bộ tên cũ để sửa cho nhanh
    }
  }, [showRenameModal]);

  useEffect(() => {
    if (showDescModal && descInputRef.current) {
        descInputRef.current.focus();
        // Đặt con trỏ xuống cuối dòng
        const len = descInputRef.current.value.length;
        descInputRef.current.setSelectionRange(len, len);
    }
  }, [showDescModal]);

  // Submit tạo folder từ Context Menu
  const submitCreateFolderCtx = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const success = await handleCreateFolder(newFolderName); // Gọi hàm từ Context
    if (success) {
      setShowCreateModal(false);
      setNewFolderName('');
    }
  };

  // --- HANDLER: SUBMIT ĐỔI TÊN ---
  const submitRename = async (e) => {
    e.preventDefault();
    if (!renameData.newName.trim()) return;

    const success = await handleRename(renameData.item, renameData.newName);
    if (success) {
        setShowRenameModal(false);
        setRenameData({ item: null, newName: '' });
    }
  };

  // --- HANDLER: SUBMIT MÔ TẢ ---
  const submitDescription = async (e) => {
    e.preventDefault();
    // Không check rỗng vì người dùng có thể muốn xóa mô tả (gửi chuỗi rỗng)
    
    const success = await handleUpdateDescription(descData.item, descData.description);
    if (success) {
        setShowDescModal(false);
        setDescData({ item: null, description: '' });
    }
  };

  // --- HÀM FETCH THÔNG TIN ---
  const fetchFileInfo = async (file) => {
    setShowInfoModal(true);
    setInfoLoading(true);
    try {
        const res = await fileService.getFileDetails(file.id);
        if (res.success) {
            setInfoData(res.data);
        }
    } catch (error) {
        toast.error("Không thể lấy thông tin file.");
        setShowInfoModal(false);
    } finally {
        setInfoLoading(false);
    }
  };

  // 1. Xử lý thêm người dùng
  const handleAddUserShare = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    try {
        const res = await fileService.shareFile(shareData.id, emailInput, permissionInput);
        if (res.success) {
            toast.success("Đã chia sẻ thành công!");
            setEmailInput(''); // Reset form
            // Reload lại data modal để hiện người mới trong danh sách
            openShareModal(shareData); 
        }
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi chia sẻ.");
    }
  };

  // 2. Xử lý xóa quyền
  // BƯỚC 1: Khi nhấn nút X (Chỉ mở Modal, chưa gọi API)
  const clickRevoke = (user) => {
    setUserToRevoke(user); // Lưu thông tin người cần xóa (Object user hoặc email)
    setShowConfirmModal(true);
  };

  // BƯỚC 2: Khi nhấn nút "Đồng ý" trong Modal (Mới gọi API)
  const confirmRevoke = async () => {
    if (!userToRevoke) return;

    setRevokeLoading(true);
    try {
        const res = await fileService.revokeAccess(shareData.id, userToRevoke.email);
        if (res.success) {
            toast.success(`Đã ngừng chia sẻ với ${userToRevoke.email}`);
            
            // Cập nhật lại danh sách shareData ngay lập tức
            setShareData(prev => ({
                ...prev,
                sharedWith: prev.sharedWith.filter(p => p.user.email !== userToRevoke.email)
            }));
            
            // Đóng modal và reset
            setShowConfirmModal(false);
            setUserToRevoke(null);
        }
    } catch (error) {
        toast.error("Không thể gỡ quyền lúc này. Vui lòng thử lại.");
    } finally {
        setRevokeLoading(false);
    }
  };

  // 3. Xử lý thay đổi Public Access
  const handleChangePublicAccess = async (e) => {
    const newAccess = e.target.value;
    try {
        const res = await fileService.changePublicAccess(shareData.id, newAccess);
        if (res.success) {
            toast.success("Đã cập nhật quyền truy cập chung.");
            setShareData(prev => ({ ...prev, publicAccess: newAccess }));
        }
    } catch (error) {
        toast.error("Lỗi cập nhật quyền.");
    }
  };

  // 4. Sao chép liên kết
  const copyLink = () => {
    const link = `http://localhost:3000/file/${shareData.id}`; // URL Demo
    navigator.clipboard.writeText(link);
    toast.success("Đã sao chép đường liên kết!");
  };

  // 5. Xử lý cập nhật quyền ngay tại danh sách
  const handleUpdatePermission = async (email, newPermission) => {
    // Không cần loading toàn trang, chỉ cần cập nhật ngầm hoặc loading nhẹ
    try {
        // Gọi lại API share để cập nhật quyền mới (Cơ chế Upsert)
        const res = await fileService.shareFile(shareData.id, email, newPermission);
        
        if (res.success) {
            toast.success("Đã cập nhật quyền thành công.");
            
            // Cập nhật lại State danh sách ngay lập tức (Optimistic Update)
            setShareData(prev => ({
                ...prev,
                sharedWith: prev.sharedWith.map(perm => 
                    perm.user.email === email 
                        ? { ...perm, permissionType: newPermission } // Cập nhật quyền mới
                        : perm
                )
            }));
        }
    } catch (error) {
        toast.error("Không thể cập nhật quyền. Vui lòng thử lại.");
    }
  };

  // Upload file từ Context Menu
  const onFileSelectCtx = async (e) => {
    // TỐI ƯU: Lấy toàn bộ FileList
    const files = e.target.files;
    
    if (files && files.length > 0) {
      await handleUploadFile(files); // Gọi hàm từ Context với danh sách file
      e.target.value = null;
    }
  };

  // Upload Folder từ Context Menu ---
  const onFolderSelectCtx = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleUploadFolder(files); // Gọi hàm upload folder của Context
      e.target.value = null;
    }
  };

  // --- HELPER: GET ICON ---
  const getFileIcon = (type, mimeType, isLarge = false) => {
    const className = isLarge ? "text-5xl mb-2" : "text-2xl";
    if (type === 'FOLDER') return <FaFolder className={`text-yellow-500 ${className}`} />;
    if (mimeType?.includes('pdf')) return <FaFilePdf className={`text-red-500 ${className}`} />;
    if (mimeType?.includes('word') || mimeType?.includes('document')) return <FaFileWord className={`text-blue-500 ${className}`} />;
    if (mimeType?.includes('image')) return <FaFileImage className={`text-purple-500 ${className}`} />;
    return <FaFileAlt className={`text-gray-400 ${className}`} />;
  };

  // 1. Lấy tên hiển thị
  const getPermissionLabel = (type) => {
      switch (type) {
          case 'EDITOR': return 'Người chỉnh sửa';
          case 'COMMENTER': return 'Người nhận xét';
          case 'VIEWER': default: return 'Người xem';
      }
  };

  // 2. Lấy màu sắc Badge (Mỗi quyền 1 màu cho dễ phân biệt)
  const getPermissionColor = (type) => {
      switch (type) {
          case 'EDITOR': 
              return 'bg-orange-50 text-orange-700 border-orange-200'; // Màu Cam
          case 'COMMENTER': 
              return 'bg-teal-50 text-teal-700 border-teal-200';     // Màu Xanh ngọc
          case 'VIEWER': 
          default: 
              return 'bg-blue-50 text-blue-700 border-blue-200';     // Màu Xanh dương
      }
  };

  // --- RENDER MENU OPTIONS CHO ITEM ---
  const renderItemMenuOptions = () => {
    if (!itemMenu.file) return null;
    const isFolder = itemMenu.file.type === 'FOLDER';

    // Định nghĩa danh sách menu
    const commonOptions = [
        { label: 'Tải xuống', action: 'DOWNLOAD', icon: <FaDownload className="text-blue-500"/> },
        { label: 'Đổi tên', action: 'RENAME', icon: <FaPen className="text-gray-500"/> },
        { label: 'Cập nhật mô tả', action: 'UPDATE_DESC', icon: <FaInfoCircle className="text-gray-500"/> },
        { label: 'Chia sẻ', action: 'SHARE', icon: <FaShareAlt className="text-blue-600"/> },
        { label: 'Sao chép đường dẫn', action: 'COPY_LINK', icon: <FaLink className="text-gray-600"/> },
        { label: 'Di chuyển', action: 'MOVE', icon: <FaArrowsAlt className="text-gray-600"/> },
        { label: 'Thông tin', action: 'INFO', icon: <FaInfoCircle className="text-blue-400"/> },
    ];

    // Menu riêng cho File
    const fileSpecific = [
        { label: 'Tạo bản sao', action: 'COPY', icon: <FaClone className="text-purple-500"/> },
    ];

    // Menu Thùng rác (Luôn ở cuối)
    const trashOption = { label: 'Chuyển vào thùng rác', action: 'TRASH', icon: <FaTrash className="text-red-500"/>, isDanger: true };

    let options = isFolder 
        ? [...commonOptions, trashOption]
        : [commonOptions[0], commonOptions[1], commonOptions[2], ...fileSpecific, commonOptions[3], commonOptions[4], commonOptions[5], commonOptions[6], trashOption];

    return (
        <div 
            className="fixed bg-white border border-gray-200 shadow-xl rounded-lg z-[100] w-60 py-2 animate-fade-in text-sm"
            style={{ top: itemMenu.y, left: itemMenu.x }}
            onClick={(e) => e.stopPropagation()} // Chặn click để không đóng menu ngay lập tức
        >
             {/* Header nhỏ hiển thị tên file */}
             <div className="px-4 py-2 border-b bg-gray-50 text-xs font-semibold text-gray-500 truncate">
                {itemMenu.file.name}
             </div>

             {options.map((opt, idx) => (
                <button 
                    key={idx}
                    onClick={() => handleMenuAction(opt.action, itemMenu.file)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 transition
                        ${opt.isDanger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
                        ${opt.label === 'Chuyển vào thùng rác' ? 'border-t mt-1' : ''}
                    `}
                >
                    <span className="text-base">{opt.icon}</span>
                    <span>{opt.label}</span>
                </button>
             ))}
        </div>
    );
  };

  // --- RENDER ---
  return (
    <div 
      className="animate-fade-in pb-10 min-h-[80vh]" 
      onContextMenu={handleContextMenu} // Kích hoạt chuột phải toàn trang
    >
      
      {/* 1. KHU VỰC THỐNG KÊ (CHỈ HIỆN Ở ROOT) */}
      {!folderId && (
        <>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Tài liệu của tôi</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <FaHdd size={24} />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Đã sử dụng</p>
                <p className="text-2xl font-bold text-gray-800">{formatBytes(stats.totalSize)}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-full">
                <FaLayerGroup size={24} />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Tổng số file</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalFiles} Files</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. THANH BREADCRUMB */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-x-auto whitespace-nowrap">
         {breadcrumbs.map((item, index) => (
             <React.Fragment key={item.id || 'root'}>
                 <div 
                    onClick={() => handleBreadcrumbClick(item)}
                    className={`flex items-center gap-1 cursor-pointer hover:text-blue-600 hover:underline ${index === breadcrumbs.length - 1 ? 'font-bold text-gray-800 pointer-events-none no-underline' : ''}`}
                 >
                     {index === 0 && <FaHome className="mb-0.5" />}
                     <span>{item.name}</span>
                 </div>
                 {index < breadcrumbs.length - 1 && <FaChevronRight className="text-gray-400 text-xs" />}
             </React.Fragment>
         ))}
      </div>

      {/* 3. TOOLBAR (SORT & VIEW MODE) */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
         <h2 className="text-lg font-semibold text-gray-700 self-start md:self-center">
            {folderId ? breadcrumbs[breadcrumbs.length - 1]?.name : 'Thư mục gốc'}
         </h2>
         
         <div className="flex items-center gap-4 self-end md:self-center">
             {/* Sort */}
             <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 hidden sm:block">Sắp xếp:</label>
                <select 
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                        const [sortBy, direction] = e.target.value.split('-');
                        setSortConfig({ sortBy, direction });
                    }}
                    defaultValue="createdAt-desc"
                >
                    <option value="createdAt-desc">Mới nhất</option>
                    <option value="createdAt-asc">Cũ nhất</option>
                    <option value="name-asc">Tên (A-Z)</option>
                    <option value="name-desc">Tên (Z-A)</option>
                    <option value="size-desc">Kích thước</option>
                </select>
             </div>

             {/* View Mode */}
             <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button 
                    onClick={() => setViewMode('list')} 
                    className={`p-1.5 rounded transition ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                    title="Danh sách"
                >
                    <FaList size={16} />
                </button>
                <button 
                    onClick={() => setViewMode('grid')} 
                    className={`p-1.5 rounded transition ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                    title="Lưới"
                >
                    <FaThLarge size={16} />
                </button>
            </div>
         </div>
      </div>

      {/* 4. MAIN CONTENT (LIST FILE) */}
      {loading ? <Loading /> : (
          files.length > 0 ? (
            <>
                {/* --- LIST VIEW --- */}
                {viewMode === 'list' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                        <table className="w-full text-left border-collapse">
                            {/* ... thead giữ nguyên ... */}
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3 border-b">Tên</th>
                                    <th className="px-6 py-3 border-b hidden sm:table-cell">Kích thước</th>
                                    <th className="px-6 py-3 border-b hidden md:table-cell">Ngày tạo</th>
                                    <th className="px-6 py-3 border-b text-right">#</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-sm">
                                {files.map((file) => (
                                    <tr 
                                        key={file.id} 
                                        className="hover:bg-blue-50 transition cursor-pointer border-b last:border-b-0 select-none group"
                                        onDoubleClick={() => handleDoubleClick(file)}
                                        onContextMenu={(e) => handleItemContextMenu(e, file)} // <--- THÊM SỰ KIỆN CHUỘT PHẢI
                                    >
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            {getFileIcon(file.type, file.mimeType)}
                                            <span className="font-medium text-gray-900 truncate max-w-xs" title={file.name}>{file.name}</span>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            {file.type === 'FOLDER' ? '--' : formatBytes(file.size)}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">{formatDate(file.createdAt)}</td>
                                        
                                        {/* CỘT ACTION: NÚT 3 CHẤM */}
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={(e) => handleThreeDotsClick(e, file)} // <--- SỰ KIỆN CLICK 3 CHẤM
                                                className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Tùy chọn"
                                            >
                                                <FaEllipsisV />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- GRID VIEW --- */}
                {viewMode === 'grid' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
                        {files.map((file) => (
                            <div 
                                key={file.id} 
                                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col items-center text-center transition group select-none relative"
                                onDoubleClick={() => handleDoubleClick(file)}
                                onContextMenu={(e) => handleItemContextMenu(e, file)}
                            >
                                {/* NÚT 3 CHẤM (Hiện khi hover) */}
                                <button 
                                    onClick={(e) => handleThreeDotsClick(e, file)} // <--- SỰ KIỆN CLICK 3 CHẤM
                                    className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition z-10"
                                >
                                    <FaEllipsisV />
                                </button>

                                <div className="mt-2 mb-3 transform group-hover:scale-110 transition duration-200">
                                    {getFileIcon(file.type, file.mimeType, true)}
                                </div>
                                <p className="text-sm font-medium text-gray-800 truncate w-full px-1 mb-1" title={file.name}>{file.name}</p>
                                <p className="text-xs text-gray-500">
                                    {file.type === 'FOLDER' ? formatDate(file.createdAt).split(' ')[0] : formatBytes(file.size)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center text-gray-500 animate-fade-in">
                <FaFolder className="mx-auto text-4xl mb-3 text-gray-300" />
                <p>Thư mục trống.</p>
                <p className="text-sm mt-1">Nhấn chuột phải để tạo mới hoặc tải lên.</p>
            </div>
          )
      )}

      {/* --- 5. CONTEXT MENU & MODALS --- */}
      
      {/* Menu Chuột phải */}
      {contextMenu.visible && (
        <div 
            className="fixed bg-white border border-gray-200 shadow-xl rounded-lg z-50 w-52 overflow-hidden animate-fade-in"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()} 
        >
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-50 border-b">
                Tùy chọn
            </div>
            <button 
                onClick={() => { setShowCreateModal(true); setContextMenu({ ...contextMenu, visible: false }); }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700 transition"
            >
                <FaFolderPlus className="text-yellow-500" /> Thư mục mới
            </button>
            <button 
                onClick={() => { fileInputRef.current.click(); setContextMenu({ ...contextMenu, visible: false }); }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700 transition"
            >
                <FaFileUpload className="text-blue-500" /> Tải tệp lên
            </button>
            <button 
                onClick={() => { folderInputRef.current.click(); setContextMenu({ ...contextMenu, visible: false }); }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-500 transition border-t"
            >
                <FaFolderOpen /> Tải thư mục lên
            </button>
        </div>
      )}

      {/* --- HIỂN THỊ MENU ITEM --- */}
      {itemMenu.visible && renderItemMenuOptions()}

      {/* Thêm Input ẩn dành riêng cho Folder */}
      <input 
        type="file"
        className="hidden"
        ref={folderInputRef}
        onChange={onFolderSelectCtx}
        webkitdirectory=""  // Quan trọng: Cho phép chọn folder (Chrome/Edge)
        directory=""        // Quan trọng: Fallback cho Firefox cũ
        multiple            // Bắt buộc
      />

      {/* Input ẩn để upload file */}
      <input 
        type="file" 
        multiple
        className="hidden" 
        ref={fileInputRef} 
        onChange={onFileSelectCtx} 
      />

      {/* Modal Tạo Folder (dùng cho Context Menu) */}
      {showCreateModal && (
         <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 animate-fade-in-down">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Tạo thư mục mới</h3>
                <form onSubmit={submitCreateFolderCtx}>
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

      {/* --- MODAL ĐỔI TÊN (MỚI) --- */}
      {showRenameModal && (
        <div 
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 animate-fade-in-down">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Đổi tên</h3>
                <form onSubmit={submitRename}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên mới</label>
                        <input 
                            ref={renameInputRef}
                            type="text" 
                            className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            value={renameData.newName}
                            onChange={(e) => setRenameData({ ...renameData, newName: e.target.value })}
                        />
                         {/* Gợi ý nhỏ nếu là file */}
                        {renameData.item?.type !== 'FOLDER' && (
                             <p className="text-xs text-gray-500 mt-1">Lưu ý: Nếu không nhập đuôi file, hệ thống sẽ giữ nguyên đuôi cũ.</p>
                        )}
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        <button 
                            type="button" 
                            onClick={() => setShowRenameModal(false)} 
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL CẬP NHẬT MÔ TẢ (MỚI) --- */}
      {showDescModal && (
        <div 
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 animate-fade-in-down">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Cập nhật mô tả</h3>
                <form onSubmit={submitDescription}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mô tả cho: <span className="font-bold text-blue-600 truncate inline-block max-w-[200px] align-bottom">{descData.item?.name}</span>
                        </label>
                        <textarea 
                            ref={descInputRef}
                            rows={4}
                            className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Nhập mô tả chi tiết..."
                            value={descData.description}
                            onChange={(e) => setDescData({ ...descData, description: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">
                            {descData.description.length}/1000 ký tự
                        </p>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        <button 
                            type="button" 
                            onClick={() => setShowDescModal(false)} 
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL THÔNG TIN CHI TIẾT (MỚI) --- */}
      {showInfoModal && (
        <div 
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-down">
                
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Thông tin chi tiết</h3>
                    <button onClick={() => setShowInfoModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {infoLoading ? (
                        <div className="flex justify-center py-10"><Loading /></div>
                    ) : infoData ? (
                        <div className="space-y-6">
                            {/* 1. Header File: Icon + Tên */}
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    {getFileIcon(infoData.type, infoData.mimeType, true)} 
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-gray-800 text-lg truncate" title={infoData.name}>{infoData.name}</p>
                                    <p className="text-sm text-gray-500">{infoData.mimeType || 'Thư mục'}</p>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* 2. Thông tin chung (Grid 2 cột) */}
                            <div className="grid grid-cols-2 gap-y-4 text-sm">
                                <div>
                                    <p className="text-gray-500 mb-1">Loại</p>
                                    <p className="font-medium">{infoData.extension ? `Tệp ${infoData.extension.toUpperCase()}` : 'Thư mục'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Kích thước</p>
                                    <p className="font-medium">{infoData.type === 'FOLDER' ? '--' : formatBytes(infoData.size)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-500 mb-1">Vị trí</p>
                                    <div className="bg-gray-50 px-3 py-2 rounded text-gray-700 truncate border border-gray-100" title={infoData.locationPath}>
                                         {infoData.locationPath}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Ngày tạo</p>
                                    <p className="font-medium">{formatDate(infoData.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Cập nhật lần cuối</p>
                                    <p className="font-medium">{formatDate(infoData.updatedAt)}</p>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* 3. Quyền & Sở hữu */}
                            <div className="space-y-4">
                                {/* Chủ sở hữu */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Chủ sở hữu</span>
                                    <div className="flex items-center gap-2">
                                        {infoData.owner?.avatarUrl ? (
                                            <img src={infoData.owner.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full" />
                                        ) : (
                                            <FaUserCircle className="text-gray-300 w-6 h-6" />
                                        )}
                                        <span className="text-sm font-medium text-gray-800">{infoData.owner?.name || infoData.owner?.email}</span>
                                    </div>
                                </div>

                                {/* Người sửa cuối */}
                                {infoData.lastModifiedBy && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Sửa lần cuối bởi</span>
                                        <span className="text-sm text-gray-700">{infoData.lastModifiedBy.name}</span>
                                    </div>
                                )}

                                {/* Trạng thái chia sẻ */}
                                <div>
                                  <p className="text-sm text-gray-500 mb-2">Quyền truy cập</p>
                                  
                                  <div className="space-y-3">
                                      {/* 1. Trạng thái Public/Private */}
                                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                          <div className="flex items-center gap-2">
                                              {infoData.publicAccess === 'PRIVATE' ? (
                                                  <div className="p-1.5 bg-gray-200 rounded-full text-gray-600"><FaLock size={12} /></div>
                                              ) : (
                                                  <div className="p-1.5 bg-green-200 rounded-full text-green-700"><FaGlobeAsia size={12} /></div>
                                              )}
                                              <div>
                                                  <p className="text-sm font-medium text-gray-800">
                                                      {infoData.publicAccess === 'PRIVATE' ? 'Riêng tư' : 'Công khai'}
                                                  </p>
                                                  <p className="text-xs text-gray-500">
                                                      {infoData.publicAccess === 'PRIVATE' 
                                                          ? 'Chỉ những người được thêm mới có quyền truy cập.' 
                                                          : 'Bất kỳ ai có đường dẫn đều có thể xem.'}
                                                  </p>
                                              </div>
                                          </div>
                                      </div>

                                      {/* 2. Danh sách người được chia sẻ (Render List thay vì Badge) */}
                                      {infoData.sharedWith && infoData.sharedWith.length > 0 ? (
                                          <div className="mt-2">
                                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Đã chia sẻ ({infoData.sharedWith.length})</p>
                                              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                                  {infoData.sharedWith.map((perm, index) => (
                                                      <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition">
                                                          {/* Thông tin User */}
                                                          <div className="flex items-center gap-2 overflow-hidden">
                                                              {perm.user?.avatarUrl ? (
                                                                  <img src={perm.user.avatarUrl} alt="avt" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                                                              ) : (
                                                                  <FaUserCircle className="text-gray-300 w-9 h-9" />
                                                              )}
                                                              <div className="truncate">
                                                                  <p className="text-sm font-medium text-gray-800 truncate" title={perm.user?.name}>{perm.user?.name}</p>
                                                                  <p className="text-xs text-gray-500 truncate" title={perm.user?.email}>{perm.user?.email}</p>
                                                              </div>
                                                          </div>

                                                          {/* Badge Quyền (ĐÃ SỬA: Hỗ trợ 3 quyền VIEWER, COMMENTER, EDITOR) */}
                                                          <span className={`text-xs font-bold px-2 py-1.5 rounded-full border min-w-[90px] text-center select-none ${
                                                              perm.permissionType === 'EDITOR'
                                                                  ? 'bg-orange-50 text-orange-700 border-orange-200'  // EDITOR: Màu Cam
                                                                  : perm.permissionType === 'COMMENTER'
                                                                      ? 'bg-teal-50 text-teal-700 border-teal-200'    // COMMENTER: Màu Xanh Ngọc
                                                                      : 'bg-blue-50 text-blue-700 border-blue-200'    // VIEWER: Màu Xanh Dương
                                                          }`}>
                                                              {perm.permissionType === 'EDITOR' 
                                                                  ? 'Chỉnh sửa' 
                                                                  : perm.permissionType === 'COMMENTER' 
                                                                      ? 'Nhận xét' 
                                                                      : 'Người xem'}
                                                          </span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      ) : (
                                          /* Empty State nếu chưa share ai */
                                          <p className="text-sm text-gray-400 italic pl-1">Chưa chia sẻ với cá nhân nào.</p>
                                      )}
                                  </div>
                              </div>
                            </div>

                            {/* 4. Mô tả (Nếu có) */}
                            {infoData.description && (
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-gray-700 mt-2">
                                    <span className="font-semibold block mb-1 text-yellow-700">Mô tả:</span>
                                    {infoData.description}
                                </div>
                            )}

                        </div>
                    ) : (
                        <p className="text-center text-gray-500">Không có dữ liệu.</p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                    <button 
                        onClick={() => setShowInfoModal(false)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL CHIA SẺ (SHARE) --- */}
      {showShareModal && (
        <div 
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-xl shadow-2xl w-[550px] max-h-[90vh] flex flex-col animate-fade-in-down overflow-hidden">
                
                {/* 1. Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                            <FaUserPlus size={16} />
                        </div>
                        Chia sẻ "{shareData?.name}"
                    </h3>
                    <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
                        <FaTimes size={20} />
                    </button>
                </div>

                {shareLoading ? (
                    <div className="p-10"><Loading /></div>
                ) : shareData ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        
                        {/* 2. Form thêm người */}
                        <form onSubmit={handleAddUserShare} className="flex gap-2 p-1 bg-white">
                          <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition shadow-sm">
                              <input 
                                  type="email" 
                                  placeholder="Nhập email người nhận..." 
                                  className="flex-1 px-3 py-2.5 outline-none text-sm text-gray-700"
                                  value={emailInput}
                                  onChange={(e) => setEmailInput(e.target.value)}
                                  required
                              />
                              
                              {/* Đường kẻ dọc ngăn cách input và select */}
                              <div className="w-[1px] h-6 bg-gray-200"></div>

                              {/* Select Custom Style */}
                              <div className="relative">
                                  <select 
                                      className="appearance-none bg-transparent pl-3 pr-8 py-2.5 text-sm font-semibold text-gray-600 outline-none cursor-pointer hover:text-blue-600 transition"
                                      value={permissionInput}
                                      onChange={(e) => setPermissionInput(e.target.value)}
                                  >
                                      <option value="VIEWER">Người xem</option>
                                      <option value="COMMENTER">Người nhận xét</option>
                                      <option value="EDITOR">Người chỉnh sửa</option>
                                  </select>
                                  {/* Mũi tên custom (Icon caret down) */}
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                                      <FaCaretDown size={12} />
                                  </div>
                              </div>
                          </div>

                          <button 
                              type="submit"
                              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap shadow-sm transition transform active:scale-95"
                          >
                              Gửi
                          </button>
                        </form>

                        {/* 3. Danh sách người có quyền truy cập */}
                        <div className="mt-2">
                          <p className="text-sm font-semibold text-gray-700 mb-3">Những người có quyền truy cập</p>
                          <div className="space-y-3">
                              
                              {/* A. Chủ sở hữu */}
                              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition">
                                  <div className="flex items-center gap-3">
                                      {shareData.owner?.avatarUrl ? (
                                          <img src={shareData.owner.avatarUrl} alt="owner" className="w-10 h-10 rounded-full border border-gray-200 object-cover" />
                                      ) : (
                                          <FaUserCircle className="text-gray-300 w-10 h-10" />
                                      )}
                                      <div>
                                          <p className="text-sm font-medium text-gray-800">
                                              {shareData.owner?.name} <span className="text-gray-400 font-normal">(bạn)</span>
                                          </p>
                                          <p className="text-xs text-gray-500">{shareData.owner?.email}</p>
                                      </div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-500 italic px-3 py-1 bg-gray-100 rounded-full">Chủ sở hữu</span>
                              </div>

                              {/* B. Danh sách được chia sẻ */}
                              {shareData.sharedWith?.map((perm, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition group">
                                      
                                      {/* 1. Thông tin User (Avatar + Tên) */}
                                      <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                                          {perm.user?.avatarUrl ? (
                                              <img src={perm.user.avatarUrl} alt="user" className="w-10 h-10 rounded-full border border-gray-200 object-cover shrink-0" />
                                          ) : (
                                              <FaUserCircle className="text-gray-300 w-10 h-10 shrink-0" />
                                          )}
                                          <div className="truncate">
                                              <p className="text-sm font-medium text-gray-800 truncate" title={perm.user?.name}>{perm.user?.name}</p>
                                              <p className="text-xs text-gray-500 truncate" title={perm.user?.email}>{perm.user?.email}</p>
                                          </div>
                                      </div>
                                      
                                      {/* 2. Cụm điều khiển (Select Quyền + Nút Xóa) */}
                                      <div className="flex items-center gap-2 shrink-0">
                                          {/* Nút xóa quyền */}
                                          <button 
                                              onClick={() => clickRevoke(perm.user)}
                                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100"
                                              title="Gỡ bỏ quyền truy cập"
                                          >
                                              <FaTimes size={14} />
                                          </button>
                                          {/* --- BADGE SELECT (Thay thế Span cũ) --- */}
                                          <div className={`relative px-2 py-1.5 rounded-full border flex items-center gap-1 transition-colors ${getPermissionColor(perm.permissionType)}`}>
                                              
                                              {/* Thẻ Select tàng hình phủ lên trên để hứng sự kiện click */}
                                              <select 
                                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                  value={perm.permissionType}
                                                  onChange={(e) => handleUpdatePermission(perm.user.email, e.target.value)}
                                              >
                                                  <option value="VIEWER">Người xem</option>
                                                  <option value="COMMENTER">Người nhận xét</option>
                                                  <option value="EDITOR">Người chỉnh sửa</option>
                                              </select>

                                              {/* Phần hiển thị giả (Text + Icon mũi tên) */}
                                              <span className="text-xs font-bold min-w-[60px] text-center select-none pointer-events-none">
                                                  {getPermissionLabel(perm.permissionType)}
                                              </span>
                                              <FaCaretDown size={10} className="pointer-events-none opacity-70" />
                                              
                                          </div>
                                          
                                          
                                      </div>
                                  </div>
                              ))}
                          </div>
                        </div>

                        {/* 4. Quyền truy cập chung */}
                        <div className="pt-4 border-t">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Quyền truy cập chung</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${shareData.publicAccess === 'PRIVATE' ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-600'}`}>
                                        {shareData.publicAccess === 'PRIVATE' ? <FaLock /> : <FaGlobeAsia />}
                                    </div>
                                    <div className="flex-1">
                                        <select 
                                            className="text-sm font-medium text-gray-800 bg-transparent outline-none cursor-pointer hover:underline appearance-none pr-4"
                                            value={shareData.publicAccess}
                                            onChange={handleChangePublicAccess}
                                            style={{ backgroundImage: 'none' }} // Hack để bỏ mũi tên default nếu muốn custom
                                        >
                                            <option value="PRIVATE">Hạn chế</option>
                                            <option value="PUBLIC_VIEW">Bất kỳ ai có đường liên kết (Người xem)</option> 
                                            <option value="PUBLIC_EDIT">Bất kỳ ai có đường liên kết (Người chỉnh sửa)</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {shareData.publicAccess === 'PRIVATE' 
                                                ? 'Chỉ những người được thêm mới có thể mở đường liên kết này.' 
                                                : shareData.publicAccess === 'PUBLIC_VIEW'
                                                  ? 'Bất kỳ ai trên Internet có đường liên kết này đều có thể xem.'
                                                  : 'Bất kỳ ai trên Internet có đường liên kết này đều có thể chỉnh sửa.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : null}

                {/* 5. Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                    <button 
                        onClick={copyLink}
                        className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition text-sm font-medium"
                    >
                        <FaLink /> Sao chép đường liên kết
                    </button>
                    <button 
                        onClick={() => setShowShareModal(false)}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                    >
                        Xong
                    </button>
                </div>

            </div>
        </div>
      )}

      {/* --- MODAL XÁC NHẬN GỠ QUYỀN (CONFIRM REVOKE) --- */}
      {showConfirmModal && userToRevoke && (
        <div 
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-lg shadow-xl p-6 w-[400px] animate-fade-in-down border-t-4 border-red-500">
                
                {/* Icon cảnh báo & Tiêu đề */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-red-100 rounded-full text-red-600 shrink-0">
                        <FaExclamationTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Ngừng chia sẻ?</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Bạn có chắc chắn muốn gỡ bỏ quyền truy cập của <span className="font-bold text-gray-800">{userToRevoke.email}</span> không?
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Họ sẽ không còn xem hoặc chỉnh sửa được tài liệu này nữa.
                        </p>
                    </div>
                </div>

                {/* Nút hành động */}
                <div className="flex justify-end gap-3 mt-6">
                    <button 
                        onClick={() => { setShowConfirmModal(false); setUserToRevoke(null); }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
                        disabled={revokeLoading}
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={confirmRevoke}
                        disabled={revokeLoading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2 shadow-sm"
                    >
                        {revokeLoading ? 'Đang xử lý...' : 'Đồng ý gỡ bỏ'}
                    </button>
                </div>

            </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;