import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Icon
import { 
  FaFolder, FaFileAlt, FaFilePdf, FaFileWord, FaFileImage, 
  FaHdd, FaLayerGroup, FaList, FaThLarge, FaChevronRight, FaHome,
  FaFolderPlus, FaFileUpload, FaFolderOpen,
  FaEllipsisV, FaDownload, FaPen, FaInfoCircle, FaShareAlt, 
  FaLink, FaArrowsAlt, FaTrash, FaClone, FaTrashRestore, 
  FaTimes, FaUserCircle, FaGlobeAsia, FaLock,
  FaUserPlus, FaCaretDown, FaExclamationTriangle,
  FaCheckSquare, FaSquare, FaExchangeAlt, FaSpinner, FaExclamationCircle,
  FaRedo
} from 'react-icons/fa';

// Components & Services
import fileService from '../../services/fileService';
import { FileContext } from '../../context/FileContext';
import { AuthContext } from '../../context/AuthContext';
import { formatBytes, formatDate } from '../../utils/format';
import Loading from '../../components/Loading';
import MoveFileModal from '../../components/Dashboard/MoveFileModal';
import DeleteConfirmModal from '../../components/Dashboard/DeleteConfirmModal';
import { useMenuPosition } from '../../hooks/useMenuPosition';
import { useFileWebSocket } from '../../hooks/useFileWebSocket';

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
    handleUpdateDescription,
    updatePermissions,
    currentPermissions
  } = useContext(FileContext);

  const { user } = useContext(AuthContext)
  const currentUserId = user?.userId;

  // 3. LOCAL STATE
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ totalFiles: 0, totalSize: 0 });
  const [loading, setLoading] = useState(false);
  
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Tài liệu của tôi' }]);
  const [sortConfig, setSortConfig] = useState({ sortBy: 'updatedAt', direction: 'desc' });
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

  // --- [MỚI] STATE CHO CHỨC NĂNG CHỌN & DI CHUYỂN ---
  const [selectedFiles, setSelectedFiles] = useState([]); // Danh sách các file đang chọn
  const [showMoveModal, setShowMoveModal] = useState(false); // Hiển thị Modal Move
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null); // Để hỗ trợ Shift+Click (nếu cần sau này)

  // --- STATE CHO MODAL XOÁ ---
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [filesToDelete, setFilesToDelete] = useState([]); // Lưu danh sách file chờ xoá
    const [deleting, setDeleting] = useState(false); // Loading state

    // [MỚI] State cho menu của Breadcrumb (Thư mục hiện tại)
  const [breadcrumbMenu, setBreadcrumbMenu] = useState({ visible: false, x: 0, y: 0, file: null });

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const renameInputRef = useRef(null);
  const descInputRef = useRef(null);
  const clickTimeoutRef = useRef(null);

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
        setBreadcrumbs([{ id: null, name: 'Tài liệu của tôi', isRoot: true, type: 'MY_ROOT' }]);

        updatePermissions({
                    canCreateFolder: true,
                    canUploadFile: true,
                    canUploadFolder: true
                });
      } else {
        // --- ĐANG Ở FOLDER CON ---
        // Nếu ở FOLDER CON -> Gọi API lấy chi tiết Folder để biết mình có quyền gì
                // (Lưu ý: API getFileDetails đã trả về permissions của user đối với folder này)
                const folderDetailRes = await fileService.getFileDetails(currentId);
                
                if (folderDetailRes.success) {
                    const perms = folderDetailRes.data.permissions;
                    updatePermissions({
                        canCreateFolder: perms.canCreateFolder,
                        canUploadFile: perms.canUploadFile,
                        canUploadFolder: perms.canUploadFolder
                    });
                }

        // Gọi API lấy chuỗi Breadcrumb từ Server (để fix lỗi F5 mất đường dẫn)
        const breadRes = await fileService.getBreadcrumbs(currentId);
        
        if (breadRes.success) {
           const crumbs = breadRes.data; // List do Backend trả về
           
           if (crumbs.length > 0) {
               // Lấy phần tử cao nhất (đầu tiên trong mảng)
               const topFolder = crumbs[0];
               
               // Lấy ID user hiện tại (thường lưu trong localStorage khi login)
               const currentUser = JSON.parse(localStorage.getItem('user')); 
               const currentUserId = currentUser?.userId; // Hoặc currentUser?._id tùy API login

               let rootCrumb;

               // LOGIC QUYẾT ĐỊNH ROOT ẢO
               if (topFolder.ownerId === currentUserId) {
                   // CASE A: File của mình -> Root là "Tài liệu của tôi"
                   rootCrumb = { id: null, name: 'Tài liệu của tôi', isRoot: true, type: 'MY_ROOT' };
               } else {
                   // CASE B: File của người khác -> Root là "Được chia sẻ"
                   rootCrumb = { path: '/shared', name: 'Được chia sẻ', isRoot: true, type: 'SHARED_ROOT' };
               }

               // Ghép Root ảo vào trước danh sách từ API
               setBreadcrumbs([rootCrumb, ...crumbs]);
           }
        }
      }
    } catch (error) {
      console.error("Load data error:", error);
      toast.error("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  // --- [MỚI] CALLBACK KHI NHẬN SOCKET ---
    const handleSocketMessage = (msg) => {
        // Tìm và update file trong danh sách
        setFiles(prevFiles => prevFiles.map(f => {
            if (f.id === msg.fileId) {
                // Cập nhật trạng thái mới (AVAILABLE/FAILED)
                return { ...f, status: msg.status };
            }
            return f;
        }));
    };

    // --- [MỚI] KÍCH HOẠT SOCKET ---
    useFileWebSocket(user.userId, handleSocketMessage);

  // --- HANDLER: ĐIỀU HƯỚNG (NAVIGATION) ---

  // Hàm xử lý click có độ trễ (để phân biệt với double click)
  const handleSmartClick = (e, file, index) => {
    // Nếu click vào checkbox hoặc nút 3 chấm thì xử lý ngay, không cần delay
    if (e.target.closest('button') || e.target.closest('.checkbox-area')) {
        handleRowClick(e, file, index);
        return;
    }

    // Nếu đã có timer đang chạy (tức là vừa click xong), đây là double click -> Hủy timer cũ
    if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
        return; // Dừng lại, để sự kiện onDoubleClick tự lo
    }

    // Tạo timer mới: Đợi 250ms, nếu không click tiếp thì mới chọn file
    clickTimeoutRef.current = setTimeout(() => {
        handleRowClick(e, file, index); // Gọi hàm chọn file cũ của bạn
        clickTimeoutRef.current = null;
    }, 250);
  };
  
  // Nhấn đúp vào file/folder
  const handleDoubleClick = (file) => {
    // Xóa timer nếu nó vẫn đang chờ (để không bị chọn nhầm)
    if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
    }

    if (file.type === 'FOLDER') {
      // [QUAN TRỌNG] Reset danh sách chọn khi chuyển folder để không bị lưu rác
      setSelectedFiles([]); 
      navigate(`/folders/${file.id}`);
    } else {
      handleFileClick(file);
    }
  };

  // Nhấn vào thanh Breadcrumb
  const handleBreadcrumbClick = (item) => {
    if (item.isRoot) {
        if (item.type === 'SHARED_ROOT') {
            navigate('/shared'); // Quay về trang danh sách share
        } else {
            navigate('/'); // Quay về trang chủ
        }
    } else {
        // Folder bình thường
        navigate(`/folders/${item.id}`);
    }
  };

  // --- 1. HÀM XỬ LÝ TẢI XUỐNG ---
  const handleDownload = async (file) => {
    const toastId = toast.loading(`Đang chuẩn bị tải: ${file.name}...`);
    try {
      // Gọi API với inline = false
      const response = await fileService.downloadFile(file.id);
      
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
      toast.dismiss(toastId);
      
          let message = "Lỗi khi tải file. Có thể file đã bị xóa hoặc không có quyền.";
      
          // 🔹 Kiểm tra nếu backend trả về JSON lỗi nhưng ở dạng Blob
          if (error.response?.data instanceof Blob) {
              try {
              const text = await error.response.data.text(); // đọc nội dung blob
              const json = JSON.parse(text);
              if (json.message) message = json.message;
              } catch (parseError) {
              console.error("Không thể parse lỗi blob:", parseError);
              }
          } else if (error.response?.data?.message) {
              message = error.response.data.message;
          }
      
          console.error("📦 Backend data:", error.response?.data);
          console.error("📄 Status:", error.response?.status);
          toast.error(message);
    }
  };

  const handleFileClick = (file) => {
      
      // Kiểm tra xem file có hỗ trợ chế độ Đọc sách không
      // (Backend đã hỗ trợ tách trang cho PDF và DOCX/DOC)
      const isViewable = 
          file.mimeType === 'application/pdf' || 
          file.name.toLowerCase().endsWith('.docx') ||
          file.name.toLowerCase().endsWith('.doc');

      if (isViewable) {
          // NẾU XEM ĐƯỢC -> CHUYỂN TRANG
          navigate(`/file/view/${file.id}`);
      } else {
          // NẾU KHÔNG -> GỌI HÀM DOWNLOAD CŨ
          handleDownload(file); 
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
    
    // Chỉ cần set vị trí nút bấm, Hook sẽ tự lo phần còn lại
    setItemMenu({
        visible: true,
        x: rect.left, // Hoặc rect.right tuỳ ý thích ban đầu
        y: rect.bottom,
        file: file
    });
    setContextMenu({ ...contextMenu, visible: false });
  };

  // 2. Chuột phải vào Item (File/Folder)
const handleItemContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    // Chỉ cần truyền đúng tọa độ chuột
    setItemMenu({ visible: true, x: e.pageX, y: e.pageY, file: file });
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

  // --- [MỚI] HELPER: TẠO ĐƯỜNG DẪN CHIA SẺ ---
  const generateShareLink = (item) => {
      const origin = window.location.origin; // Lấy domain hiện tại (VD: http://localhost:3000)
      
      if (item.type === 'FOLDER') {
          return `${origin}/folders/${item.id}`;
      } else {
          return `${origin}/file/view/${item.id}`;
      }
  };

  // 3. Xử lý hành động khi chọn menu
  const handleMenuAction = (action, file) => {
    setItemMenu({ ...itemMenu, visible: false }); // Đóng menu sau khi chọn
    setBreadcrumbMenu(prev => ({ ...prev, visible: false }));
    
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
            const link = generateShareLink(file);            
            navigator.clipboard.writeText(link)
                .then(() => toast.success("Đã sao chép liên kết!"))
                .catch(() => toast.error("Lỗi khi sao chép."));
            break;
        case 'MOVE':
            setSelectedFiles([file]); 
            setShowMoveModal(true);
            break;
        case 'INFO':
            fetchFileInfo(file); // <--- GỌI HÀM NÀY
            break;
        case 'TRASH':
            handleSoftDelete([file]); 
            break;
        case 'COPY': // Chỉ cho file
            handleCopyFile(file); // <--- Gọi hàm xử lý copy
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
        setBreadcrumbMenu({ ...breadcrumbMenu, visible: false });
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenu, itemMenu, breadcrumbMenu]);

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

  // [THÊM MỚI] Hàm xử lý Copy
    const handleCopyFile = async (file) => {
        const toastId = toast.loading("Đang tạo bản sao...");
        try {
            const res = await fileService.copyFile(file.id);
            if (res.success) {
                toast.update(toastId, { 
                    render: `Đã tạo bản sao: ${res.data.name}`, 
                    type: "success", 
                    isLoading: false, 
                    autoClose: 3000 
                });
                
                // Refresh lại danh sách để hiện file mới
                fetchData();
            }
        } catch (error) {
            toast.update(toastId, { 
                render: error.response?.data?.message || "Lỗi khi tạo bản sao.", 
                type: "error", 
                isLoading: false, 
                autoClose: 3000 
            });
        }
    }

  // --- [MỚI] HÀM XỬ LÝ CHỌN FILE ---
  
  // 1. Chọn 1 file (Click vào checkbox hoặc Ctrl+Click)
  const handleSelectFile = (e, file) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài
    
    // Kiểm tra xem file đã được chọn chưa
    const isSelected = selectedFiles.some(f => f.id === file.id);

    if (isSelected) {
      // Bỏ chọn
      setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    } else {
      // Thêm vào danh sách chọn
      setSelectedFiles(prev => [...prev, file]);
    }
  };

  // 2. Chọn tất cả (Click vào checkbox ở Header)
  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]); // Bỏ chọn hết
    } else {
      setSelectedFiles([...files]); // Chọn hết
    }
  };

// --- HÀM XỬ LÝ CLICK VÀO HÀNG (Hỗ trợ Ctrl và Shift) ---
  const handleRowClick = (e, file, index) => {
    // 1. Nếu click vào nút 3 chấm hoặc checkbox thì không xử lý logic dòng ở đây
    if (e.target.closest('button') || e.target.closest('.checkbox-area')) return;

    // 2. XỬ LÝ SHIFT + CLICK (Chọn theo dải)
    if (e.shiftKey && lastSelectedIndex !== null) {
        // Tìm vị trí bắt đầu và kết thúc
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);

        // Cắt mảng files từ start đến end (slice không lấy phần tử cuối nên phải +1)
        const newSelection = files.slice(start, end + 1);
        
        setSelectedFiles(newSelection);
        
        // Ngăn chọn văn bản mặc định của trình duyệt khi giữ Shift
        window.getSelection().removeAllRanges(); 
        return;
    }

    // 3. XỬ LÝ CTRL + CLICK (Chọn thêm / Bỏ chọn lẻ tẻ)
    if (e.ctrlKey || e.metaKey) {
       handleSelectFile(e, file);
       setLastSelectedIndex(index); // Cập nhật vị trí click cuối cùng
       return;
    }

    // 4. CLICK THƯỜNG (Chọn duy nhất file này)
    setSelectedFiles([file]);
    setLastSelectedIndex(index); // Cập nhật vị trí click cuối cùng
  };

  // --- [MỚI] HÀM CALLBACK SAU KHI DI CHUYỂN THÀNH CÔNG ---
  const handleMoveSuccess = () => {
    fetchData(); // Tải lại danh sách file
    setSelectedFiles([]); // Reset danh sách chọn
    // Cập nhật lại breadcrumbs hoặc stats nếu cần thiết
  };

  // --- HANDLER: BREADCRUMB MENU ---

  // 1. Click chuột trái vào mũi tên nhỏ
  const handleBreadcrumbArrowClick = (e, item) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài (để không navigate/reload)
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Mở menu ngay bên dưới mũi tên
    setBreadcrumbMenu({
        visible: true,
        x: rect.left,
        y: rect.bottom + 5, // Cách ra một chút cho đẹp
        file: { ...item, type: 'FOLDER' } // Đảm bảo nó được hiểu là Folder
    });
  };

  // 2. Click chuột phải vào item cuối cùng (Current Folder)
  const handleBreadcrumbContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Mở menu tại vị trí chuột
    setBreadcrumbMenu({
        visible: true,
        x: e.pageX,
        y: e.pageY,
        file: { ...item, type: 'FOLDER' }
    });
  };

  const handleSoftDelete = (items) => {
        // items là mảng file/folder người dùng chọn
        if (!items || items.length === 0) return;
        
        setFilesToDelete(items);
        setShowDeleteModal(true);
    };

    const executeDelete = async () => {
        if (filesToDelete.length === 0) return;

        setDeleting(true); // Bật loading
        const toastId = toast.loading("Đang chuyển vào thùng rác...");

        try {
            const ids = filesToDelete.map(f => f.id);
            const res = await fileService.moveToTrash(ids);

            if (res.success) {
                toast.update(toastId, { 
                    render: `Đã xóa thành công`, 
                    type: "success", 
                    isLoading: false, 
                    autoClose: 2000 
                });

                // Refresh dữ liệu
                fetchData();
                setSelectedFiles([]); // Bỏ chọn
                setShowDeleteModal(false); // Đóng modal
                setFilesToDelete([]);
            }
        } catch (error) {
            toast.update(toastId, { 
                render: "Lỗi khi xóa file.", 
                type: "error", 
                isLoading: false, 
                autoClose: 3000 
            });
        } finally {
            setDeleting(false);
        }
    };

    // Hàm xử lý Retry
  const handleRetry = async (e, file) => {
      e.stopPropagation(); // Chặn click vào row
      const toastId = toast.loading("Đang thử xử lý lại...");
      
      try {
          // 1. Gọi API
          const res = await fileService.retryFile(file.id);
          
          if (res.success) {
              // 2. Cập nhật UI ngay lập tức sang PROCESSING (Optimistic Update)
              setFiles(prev => prev.map(f => 
                  f.id === file.id ? { ...f, status: 'PROCESSING' } : f
              ));
              
              toast.update(toastId, { 
                  render: "Đã gửi yêu cầu xử lý lại.", 
                  type: "success", isLoading: false, autoClose: 2000 
              });
          }
      } catch (error) {
          toast.update(toastId, { 
              render: "Không thể thử lại.", 
              type: "error", isLoading: false, autoClose: 2000 
          });
      }
  };

  // 4. Sao chép liên kết
  const copyLink = () => {
    if (!shareData) return;

    // [SỬA] Sử dụng hàm helper tương tự
    const link = generateShareLink(shareData);
    
    navigator.clipboard.writeText(link)
        .then(() => toast.success("Đã sao chép đường liên kết!"))
        .catch(() => toast.error("Lỗi khi sao chép."));
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

  // Upload file từ Context Menu
  const onFileSelectCtx = async (e) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    // Chuyển FileList sang Array để lọc
    const allFiles = Array.from(rawFiles);
    
    // LỌC FILE HỢP LỆ
    const validFiles = allFiles.filter(file => isAllowedFile(file));

    // Cảnh báo nếu có file bị loại bỏ
    if (validFiles.length < allFiles.length) {
        toast.warning(`Đã bỏ qua ${allFiles.length - validFiles.length} tệp không hỗ trợ (Chỉ chấp nhận PDF, Word).`);
    }
    
    if (validFiles.length > 0) {
      // Lưu ý: Đảm bảo handleUploadFile trong Context nhận vào mảng File[]
      await handleUploadFile(validFiles); 
    }
    
    e.target.value = null; // Reset input để chọn lại file cũ được
  };

  // Upload Folder từ Context Menu
  const onFolderSelectCtx = async (e) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    const allFiles = Array.from(rawFiles);

    // LỌC FILE TRONG FOLDER
    // Chỉ giữ lại PDF/Word, loại bỏ các file khác trong folder
    const validFiles = allFiles.filter(file => isAllowedFile(file));

    if (validFiles.length === 0) {
        toast.error("Thư mục không chứa tệp PDF hoặc Word nào.");
        e.target.value = null;
        return;
    }

    if (validFiles.length < allFiles.length) {
        toast.info(`Đang tải lên ${validFiles.length} tệp hợp lệ trong thư mục.`);
    }

    // Gọi hàm upload folder của Context với danh sách ĐÃ LỌC
    await handleUploadFolder(validFiles); 
    
    e.target.value = null;
  };

  // --- HELPER: GET ICON ---
  const getFileIcon = (file, isLarge = false) => { // Sửa tham số nhận cả object file
    const { type, mimeType, status } = file;
    const className = isLarge ? "text-5xl mb-2" : "text-2xl";

    // 1. Nếu đang xử lý -> Trả về Spinner xoay
    if (status === 'PROCESSING') {
        return <FaSpinner className={`text-blue-500 animate-spin ${className}`} />;
    }

    // 2. Nếu lỗi -> Trả về dấu chấm than
    if (status === 'FAILED') {
        return <FaExclamationCircle className={`text-red-500 ${className}`} />;
    }

    // 3. Trạng thái bình thường (AVAILABLE) -> Logic cũ
    if (type === 'FOLDER') return <FaFolder className={`text-yellow-500 ${className}`} />;
    if (mimeType?.includes('pdf')) return <FaFilePdf className={`text-red-500 ${className}`} />;
    if (mimeType?.includes('word') || mimeType?.includes('document')) return <FaFileWord className={`text-blue-500 ${className}`} />;
    if (mimeType?.includes('image')) return <FaFileImage className={`text-purple-500 ${className}`} />;
    return <FaFileAlt className={`text-gray-400 ${className}`} />;
  };

  // 1. Lấy tên hiển thị
  const getPermissionLabel = (type) => {
      switch (type) {
          case 'INHERITED_OWNER': return 'Chủ sở hữu (Kế thừa)'; // [MỚI]
          case 'EDITOR': return 'Người chỉnh sửa';
          case 'COMMENTER': return 'Người nhận xét';
          case 'VIEWER': default: return 'Người xem';
      }
  };

  // 2. Lấy màu sắc Badge
  const getPermissionColor = (type) => {
      switch (type) {
          case 'INHERITED_OWNER':
              return 'bg-purple-50 text-purple-700 border-purple-200'; // [MỚI] Màu Tím quyền lực
          case 'EDITOR': 
              return 'bg-orange-50 text-orange-700 border-orange-200'; 
          case 'COMMENTER': 
              return 'bg-teal-50 text-teal-700 border-teal-200';     
          case 'VIEWER': 
          default: 
              return 'bg-blue-50 text-blue-700 border-blue-200';     
      }
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
      <div className="flex items-center gap-1 mb-4 text-sm text-gray-600 bg-white p-2 rounded-lg border border-gray-200 overflow-x-auto whitespace-nowrap shadow-sm">
         {breadcrumbs.map((item, index) => {
             const isLast = index === breadcrumbs.length - 1;
             
             // [MỚI] Biến kiểm tra xem có được hiện Menu không
             // Chỉ hiện nếu là item cuối VÀ KHÔNG PHẢI LÀ ROOT
             const showMenu = isLast && !item.isRoot;

             return (
              <React.Fragment key={item.id || item.type || index}>
                  <div 
                    // [LOGIC CLICK]
                    // Nếu là item cuối -> Không navigate
                    // Nếu là item trước -> Navigate bình thường
                    onClick={() => !isLast && handleBreadcrumbClick(item)}
                    
                    // [LOGIC CHUỘT PHẢI] 
                    // Chỉ kích hoạt nếu là item cuối VÀ không phải Root
                    onContextMenu={(e) => showMenu ? handleBreadcrumbContextMenu(e, item) : null}

                    // [STYLE]
                    className={`
                        flex items-center gap-2 px-2 py-1 rounded-md transition-colors select-none
                        ${isLast 
                            ? 'font-bold text-gray-800 bg-blue-50 cursor-default' // Bỏ hover nếu là item cuối
                            : 'cursor-pointer hover:bg-gray-100 text-gray-600'
                        }
                    `}
                  >
                      {/* ICON */}
                      {index === 0 && (
                         item.type === 'SHARED_ROOT' ? <FaShareAlt className="text-gray-500" /> : <FaHome className="text-gray-500" />
                      )}
                      
                      {/* TÊN */}
                      <span className="truncate max-w-[200px]">{item.name}</span>

                      {/* [MỚI] MŨI TÊN NHỎ */}
                      {/* Chỉ hiện nếu là item cuối VÀ KHÔNG PHẢI ROOT */}
                      {showMenu && (
                          <div 
                            onClick={(e) => handleBreadcrumbArrowClick(e, item)}
                            className="ml-1 p-0.5 rounded-sm hover:bg-blue-200 text-gray-500 hover:text-blue-700 cursor-pointer transition"
                          >
                              <FaCaretDown size={12} />
                          </div>
                      )}
                  </div>
                  
                  {/* Dấu mũi tên ngăn cách */}
                  {index < breadcrumbs.length - 1 && <FaChevronRight className="text-gray-300 text-xs mx-1" />}
              </React.Fragment>
             );
         })}
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
                    defaultValue="updatedAt-desc"
                >
                    <option value="updatedAt-desc">Mới nhất</option>
                    <option value="updatedAt-asc">Cũ nhất</option>
                    <option value="name-asc">Tên (A-Z)</option>
                    <option value="name-desc">Tên (Z-A)</option>
                    <option value="size-desc">Kích thước giảm dần</option>
                    <option value="size-asc">Kích thước tăng dần</option>
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

      {/* --- [MỚI] TOOLBAR HÀNH ĐỘNG HÀNG LOẠT --- */}
      {selectedFiles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg mb-4 flex justify-between items-center animate-fade-in">
          <div className="flex items-center gap-3 px-2">
             <span className="font-bold text-blue-800 text-sm">{selectedFiles.length} mục đã chọn</span>
             <button onClick={() => setSelectedFiles([])} className="text-xs text-blue-600 hover:underline">Bỏ chọn</button>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Nút Di chuyển */}
             {/* Chỉ hiện nút Di chuyển nếu TẤT CẢ file được chọn đều có quyền Move */}
            {selectedFiles.every(f => f.permissions?.canMove) && (
                <button 
                        onClick={() => setShowMoveModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 rounded text-sm font-medium transition shadow-sm"
                    >
                        <FaExchangeAlt className="text-gray-500" /> Di chuyển
                    </button>
            )}

             {/* Nút Xoá nhiều (Bạn có thể thêm logic xoá nhiều sau này) */}
             {/* Chỉ hiện nút Xóa nếu TẤT CẢ file được chọn đều có quyền Delete */}
            {selectedFiles.every(f => f.permissions?.canDelete) && (
                <button 
                        className="flex items-center gap-2 px-3 py-1.5 bg-white text-red-600 border border-gray-300 hover:bg-red-50 rounded text-sm font-medium transition shadow-sm"
                        onClick={() => handleSoftDelete(selectedFiles)}
                    >
                        <FaTrash /> Xóa
                </button>
            )}
          </div>
        </div>
      )}

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
                                    {/* [MỚI] THÊM CỘT CHECKBOX HEADER */}
                                    <th className="px-4 py-3 border-b w-10 text-center">
                                        <button onClick={handleSelectAll} className="text-gray-400 hover:text-blue-600">
                                            {selectedFiles.length > 0 && selectedFiles.length === files.length ? <FaCheckSquare className="text-blue-600 text-lg"/> : <FaSquare className="text-lg"/>}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 border-b">Tên</th>
                                    <th className="px-6 py-3 border-b hidden sm:table-cell">Kích thước</th>
                                    <th className="px-6 py-3 border-b hidden md:table-cell">Ngày sửa đổi</th>
                                    <th className="px-6 py-3 border-b text-right">#</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-sm">
                                {files.map((file, index) => {
                                    // Check xem file này có đang được chọn không
                                    const isSelected = selectedFiles.some(f => f.id === file.id);
                                    const isProcessing = file.status === 'PROCESSING'; // [MỚI] Check trạng thái
                                    const isFailed = file.status === 'FAILED';

                                    return (
                                        <tr 
                                            key={file.id} 
                                            // [MỚI] SỰ KIỆN CLICK ROW
                                            onClick={(e) => !isProcessing && !isFailed && handleSmartClick(e, file, index)}
                                            onDoubleClick={() => !isProcessing && !isFailed && handleDoubleClick(file)}
                                            onContextMenu={(e) => handleItemContextMenu(e, file)}
                                            // [MỚI] ĐỔI MÀU NỀN KHI CHỌN
                                            className={`transition border-b last:border-b-0 select-none group 
                                                ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                                                ${(isProcessing || isFailed) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                        >
                                            {/* [MỚI] CỘT CHECKBOX ROW */}
                                            <td className="px-4 py-4 text-center checkbox-area">
                                                <button onClick={(e) => handleSelectFile(e, file)} className="text-gray-300 hover:text-blue-500">
                                                    {isSelected ? <FaCheckSquare className="text-blue-600 text-lg"/> : <FaSquare className="text-lg"/>}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                {/* Gọi hàm getFileIcon mới (truyền cả object file) */}
                                                {getFileIcon(file)} 
                                                
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 truncate max-w-xs" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                    {/* [MỚI] Hiển thị dòng trạng thái nhỏ bên dưới tên */}
                                                    {isProcessing && <span className="text-xs text-blue-500 italic">Đang xử lý...</span>}
                                                    {isFailed && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-red-500 italic">Lỗi xử lý</span>
                                                            <button 
                                                                onClick={(e) => handleRetry(e, file)}
                                                                className="text-xs flex items-center gap-1 text-gray-500 hover:text-blue-600 bg-gray-100 px-2 py-0.5 rounded border transition"
                                                                title="Thử xử lý lại"
                                                            >
                                                                <FaRedo size={10} /> Thử lại
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell">
                                                {file.type === 'FOLDER' ? '--' : formatBytes(file.size)}
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">{formatDate(file.updatedAt)}</td>
                                            
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
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- GRID VIEW --- */}
                {viewMode === 'grid' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
                        {files.map((file, index) => {
                            const isSelected = selectedFiles.some(f => f.id === file.id);
                            const isProcessing = file.status === 'PROCESSING'; // [MỚI] Check trạng thái
                            const isFailed = file.status === 'FAILED';

                            return (
                                <div 
                                    key={file.id} 
                                    // [MỚI] Cập nhật class để hiện border xanh khi chọn
                                    className={`p-4 rounded-lg border shadow-sm flex flex-col items-center text-center transition group select-none relative
                                        ${isSelected ? 'bg-blue-50 border-blue-500 shadow-md' : 'bg-white border-gray-200 hover:shadow-md'}
                                        ${(isProcessing || isFailed) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                    // [MỚI] Sự kiện Click
                                    onClick={(e) => !isProcessing && !isFailed && handleSmartClick(e, file, index)}
                                    onDoubleClick={() => !isProcessing && !isFailed && handleDoubleClick(file)}
                                    onContextMenu={(e) => handleItemContextMenu(e, file)}
                                >
                                    {/* [MỚI] CHECKBOX TRÊN GÓC TRÁI (Hiện khi hover hoặc đã chọn) */}
                                    <div className={`absolute top-2 left-2 z-10 checkbox-area ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition`}>
                                        <button onClick={(e) => handleSelectFile(e, file)}>
                                            {isSelected ? <FaCheckSquare className="text-blue-600 text-lg bg-white rounded-sm"/> : <FaSquare className="text-gray-300 text-lg hover:text-gray-400"/>}
                                        </button>
                                    </div>
                                    {/* NÚT 3 CHẤM (Hiện khi hover) */}
                                    <button 
                                        onClick={(e) => handleThreeDotsClick(e, file)} // <--- SỰ KIỆN CLICK 3 CHẤM
                                        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition z-10"
                                    >
                                        <FaEllipsisV />
                                    </button>

                                    <div className="mt-2 mb-3 transform group-hover:scale-110 transition duration-200">
                                        {getFileIcon(file, true)} {/* true = icon lớn */}
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 truncate w-full px-1 mb-1" title={file.name}>{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {isProcessing ? (
                                            <span className="text-blue-500 italic">Đang xử lý...</span>
                                        ) : isFailed ? (
                                            <button 
                                                onClick={(e) => handleRetry(e, file)}
                                                className="flex items-center justify-center gap-1 text-red-500 hover:text-red-700 w-full"
                                            >
                                                <span className="italic">Lỗi</span> <FaRedo size={12}/>
                                            </button>
                                        ) : (
                                            file.type === 'FOLDER' ? formatDate(file.updatedAt).split(' ')[0] : formatBytes(file.size)
                                        )}
                                    </p>
                                </div>
                            )
                        })}
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
      
      {/* 1. Menu Nền */}
        <BackgroundContextMenu 
            menuState={contextMenu}
            onClose={() => setContextMenu({ ...contextMenu, visible: false })}
            onAction={(type) => {
                setContextMenu({ ...contextMenu, visible: false });
                if (type === 'CREATE_FOLDER') setShowCreateModal(true);
                if (type === 'UPLOAD_FILE') fileInputRef.current.click();
                if (type === 'UPLOAD_FOLDER') folderInputRef.current.click();
            }}
            permissions={currentPermissions}
        />

        {/* 2. Menu Item */}
        <ItemContextMenu 
            menuState={itemMenu}
            onClose={() => setItemMenu({ ...itemMenu, visible: false })}
            onAction={handleMenuAction} // Truyền hàm xử lý action cũ vào
        />

        {/* [MỚI] MENU CHO BREADCRUMB */}
        <ItemContextMenu 
            menuState={breadcrumbMenu}
            onClose={() => setBreadcrumbMenu({ ...breadcrumbMenu, visible: false })}
            onAction={handleMenuAction} // Tái sử dụng hàm xử lý action cũ
        />

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
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                                        <span className="text-sm font-medium text-gray-800">
                                            {infoData.owner?.name || infoData.owner?.email}
                                            {/* [MỚI] Thêm (bạn) */}
                                            {infoData.owner?.id === currentUserId && <span className="text-gray-400 font-normal ml-1">(bạn)</span>}
                                        </span>
                                    </div>
                                </div>

                                {/* Người sửa cuối */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Sửa lần cuối bởi</span>
                                    <div className="flex items-center gap-2">
                                        {infoData.lastModifiedBy?.avatarUrl ? (
                                            <img src={infoData.lastModifiedBy.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full" />
                                        ) : (
                                            <FaUserCircle className="text-gray-300 w-6 h-6" />
                                        )}
                                        <span className="text-sm font-medium text-gray-800">
                                            {infoData.lastModifiedBy?.name || infoData.lastModifiedBy?.email}
                                            {/* [MỚI] Thêm (bạn) */}
                                            {infoData.lastModifiedBy?.id === currentUserId && <span className="text-gray-400 font-normal ml-1">(bạn)</span>}
                                        </span>
                                    </div>
                                </div>

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
                                                          ? 'Chỉ những người được thêm mới có thể mở đường liên kết này.' 
                                                          : infoData.publicAccess === 'PUBLIC_VIEW'
                                                            ? 'Bất kỳ ai trên Internet có đường liên kết này đều có thể xem.'
                                                            : 'Bất kỳ ai trên Internet có đường liên kết này đều có thể chỉnh sửa.'}
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
                                                            {/* Avatar code giữ nguyên */}
                                                            {perm.user?.avatarUrl ? (
                                                                <img src={perm.user.avatarUrl} alt="avt" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                                                            ) : (
                                                                <FaUserCircle className="text-gray-300 w-9 h-9" />
                                                            )}
                                                            
                                                            <div className="truncate">
                                                                <p className="text-sm font-medium text-gray-800 truncate" title={perm.user?.name}>
                                                                    {perm.user?.name}
                                                                    {/* [MỚI] Thêm (bạn) */}
                                                                    {perm.user?.id === currentUserId && <span className="text-gray-400 font-normal ml-1">(bạn)</span>}
                                                                </p>
                                                                <p className="text-xs text-gray-500 truncate" title={perm.user?.email}>{perm.user?.email}</p>
                                                            </div>
                                                        </div>

                                                        {/* Badge Quyền (Updated Logic) */}
                                                        <span className={`text-xs font-bold px-2 py-1.5 rounded-full border min-w-[90px] text-center select-none 
                                                            ${getPermissionColor(perm.permissionType)}`}
                                                        >
                                                            {getPermissionLabel(perm.permissionType)}
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
                                            {shareData.owner?.name} 
                                            
                                            {/* [SỬA] So sánh ID owner với ID current user */}
                                            {shareData.owner?.id === currentUserId && (
                                                <span className="text-gray-400 font-normal ml-1">(bạn)</span>
                                            )}
                                          </p>
                                          <p className="text-xs text-gray-500">{shareData.owner?.email}</p>
                                      </div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-500 italic px-3 py-1 bg-gray-100 rounded-full">Chủ sở hữu</span>
                              </div>

                              {/* B. Danh sách được chia sẻ */}
                              {shareData.sharedWith?.map((perm, idx) => {
                                // [MỚI] Biến kiểm tra xem có phải Thái Thượng Hoàng không
                                const isInherited = perm.permissionType === 'INHERITED_OWNER';
                                const isMe = perm.user?.id === currentUserId;

                                return (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition group">
                                        
                                        {/* 1. Thông tin User */}
                                        <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                                            {perm.user?.avatarUrl ? (
                                                <img src={perm.user.avatarUrl} alt="user" className="w-10 h-10 rounded-full border border-gray-200 object-cover shrink-0" />
                                            ) : (
                                                <FaUserCircle className="text-gray-300 w-10 h-10 shrink-0" />
                                            )}
                                            
                                            <div className="truncate">
                                                {/* [SỬA] Hiển thị tên kèm (bạn) nếu trùng ID */}
                                                <p className="text-sm font-medium text-gray-800 truncate" title={perm.user?.name}>
                                                    {perm.user?.name}
                                                    {isMe && <span className="text-gray-400 font-normal ml-1">(bạn)</span>}
                                                </p>
                                                
                                                <p className="text-xs text-gray-500 truncate" title={perm.user?.email}>{perm.user?.email}</p>
                                            </div>
                                        </div>
                                        
                                        {/* 2. Cụm điều khiển (Select Quyền + Nút Xóa) */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            
                                            {/* Nút xóa quyền: CHỈ HIỆN NẾU KHÔNG PHẢI KẾ THỪA */}
                                            {!isInherited && (
                                                <button 
                                                    onClick={() => clickRevoke(perm.user)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100"
                                                    title="Gỡ bỏ quyền truy cập"
                                                >
                                                    <FaTimes size={14} />
                                                </button>
                                            )}

                                            {/* --- BADGE SELECT --- */}
                                            <div className={`relative px-2 py-1.5 rounded-full border flex items-center gap-1 transition-colors ${getPermissionColor(perm.permissionType)}`}>
                                                
                                                {/* Thẻ Select tàng hình: CHỈ RENDER NẾU KHÔNG PHẢI KẾ THỪA */}
                                                {!isInherited && (
                                                    <select 
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        value={perm.permissionType}
                                                        onChange={(e) => handleUpdatePermission(perm.user.email, e.target.value)}
                                                    >
                                                        <option value="VIEWER">Người xem</option>
                                                        <option value="COMMENTER">Người nhận xét</option>
                                                        <option value="EDITOR">Người chỉnh sửa</option>
                                                    </select>
                                                )}

                                                {/* Phần hiển thị Text + Icon */}
                                                <span className="text-xs font-bold min-w-[60px] text-center select-none pointer-events-none">
                                                    {getPermissionLabel(perm.permissionType)}
                                                </span>
                                                
                                                {/* Chỉ hiện mũi tên nếu cho phép sửa */}
                                                {!isInherited && (
                                                    <FaCaretDown size={10} className="pointer-events-none opacity-70" />
                                                )}
                                                
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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

      {/* [MỚI] MODAL DI CHUYỂN */}
      <MoveFileModal 
          isOpen={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          selectedItems={selectedFiles} // Truyền danh sách file đang chọn
          onSuccess={handleMoveSuccess} // Callback khi xong
      />

      {/* MODAL XOÁ ĐẸP */}
            <DeleteConfirmModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={executeDelete}
                count={filesToDelete.length}
                isLoading={deleting}
                isPermanent={false} // Đây là xóa tạm vào thùng rác
            />
    </div>
  );
};

// Component hiển thị Menu cho File/Folder
const ItemContextMenu = ({ menuState, onClose, onAction }) => {
    const menuRef = useRef(null);
    const { top, left } = useMenuPosition(menuRef, menuState.x, menuState.y, menuState.visible);

    const file = menuState.file;
    if (!file || !menuState.visible) return null;

    // 1. Lấy quyền từ object permissions mới (Fallback về false để an toàn)
    const perms = file.permissions || {
        canDownload: false,
        canRename: false,
        canUpdateDescription: false,
        canMove: false,
        canCopy: false,
        canShare: false,
        canDelete: false,
        canRestore: false,
        canViewDetails: true,
        canCopyLink: true
    };

    // 2. Config Menu (Map đúng key từ BE)
    const menuConfig = [
        // Nhóm Tải
        { label: 'Tải xuống', action: 'DOWNLOAD', icon: <FaDownload className="text-blue-500"/>, show: perms.canDownload },
        
        // Nhóm Sửa đổi
        { label: 'Đổi tên', action: 'RENAME', icon: <FaPen className="text-gray-500"/>, show: perms.canRename },
        { label: 'Di chuyển', action: 'MOVE', icon: <FaArrowsAlt className="text-gray-600"/>, show: perms.canMove },
        { label: 'Tạo bản sao', action: 'COPY', icon: <FaClone className="text-purple-500"/>, show: perms.canCopy }, // BE đã check folder/file
        
        // Nhóm Chia sẻ
        { label: 'Chia sẻ', action: 'SHARE', icon: <FaShareAlt className="text-blue-600"/>, show: perms.canShare },
        { label: 'Sao chép liên kết', action: 'COPY_LINK', icon: <FaLink className="text-gray-600"/>, show: perms.canCopyLink },
        
        // Nhóm Khác
        { label: 'Cập nhật mô tả', action: 'UPDATE_DESC', icon: <FaInfoCircle className="text-gray-500"/>, show: perms.canUpdateDescription }, // Thường đi kèm quyền Rename
        { label: 'Thông tin chi tiết', action: 'INFO', icon: <FaInfoCircle className="text-blue-400"/>, show: perms.canViewDetails },
        
        // Nhóm Thùng rác
        { label: 'Khôi phục', action: 'RESTORE', icon: <FaTrashRestore className="text-green-600"/>, show: perms.canRestore },
        { label: 'Chuyển vào thùng rác', action: 'TRASH', icon: <FaTrash className="text-red-500"/>, isDanger: true, show: perms.canDelete } // Soft Delete
    ];

    const validOptions = menuConfig.filter(opt => opt.show);
    if (validOptions.length === 0) return null;

    return (
        <div 
            ref={menuRef}
            className="fixed bg-white border border-gray-200 shadow-xl rounded-lg z-[100] w-64 py-2 animate-fade-in text-sm"
            style={{ top, left, visibility: top === -9999 ? 'hidden' : 'visible' }}
            onClick={(e) => e.stopPropagation()}
        >
             <div className="px-4 py-2 border-b bg-gray-50 text-xs font-semibold text-gray-500 truncate select-none">
                {file.name}
             </div>
             <div className="py-1">
                 {validOptions.map((opt, idx) => (
                    <button 
                        key={idx}
                        onClick={() => onAction(opt.action, file)}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 transition
                            ${opt.isDanger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
                            ${opt.action === 'TRASH' ? 'border-t mt-1' : ''}
                        `}
                    >
                        <span className="text-base min-w-[20px]">{opt.icon}</span>
                        <span>{opt.label}</span>
                    </button>
                 ))}
             </div>
        </div>
    );
};

// Component hiển thị Menu chuột phải ở vùng trống
const BackgroundContextMenu = ({ menuState, onClose, onAction, permissions }) => {
    const menuRef = useRef(null);
    const { top, left } = useMenuPosition(menuRef, menuState.x, menuState.y, menuState.visible);

    if (!menuState.visible) return null;

    // Fallback nếu chưa load xong permissions
    const perms = permissions || { canCreateFolder: false, canUploadFile: false, canUploadFolder: false };

    // Helper render button item
    const renderMenuItem = (label, action, icon, canDo, isBorderTop = false) => {
        return (
            <button 
                onClick={() => {
                    if (canDo) onAction(action);
                }}
                disabled={!canDo}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition
                    ${isBorderTop ? 'border-t' : ''}
                    ${canDo 
                        ? 'text-gray-700 hover:bg-gray-100 cursor-pointer' 
                        : 'text-gray-400 cursor-not-allowed bg-gray-50' // Style disabled
                    }
                `}
                title={!canDo ? "Bạn không có quyền thực hiện hành động này" : ""}
            >
                <span className={canDo ? "" : "opacity-50"}>{icon}</span>
                <span>{label}</span>
            </button>
        );
    };

    return (
        <div 
            ref={menuRef}
            className="fixed bg-white border border-gray-200 shadow-xl rounded-lg z-50 w-52 overflow-hidden animate-fade-in"
            style={{ top, left, visibility: top === -9999 ? 'hidden' : 'visible' }}
            onClick={(e) => e.stopPropagation()} 
        >
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-50 border-b">
                Tùy chọn thư mục
            </div>
            
            {/* Tạo thư mục mới */}
            {renderMenuItem(
                'Thư mục mới', 
                'CREATE_FOLDER', 
                <FaFolderPlus className={perms.canCreateFolder ? "text-yellow-500" : "text-gray-400"} />, 
                perms.canCreateFolder
            )}

            {/* Tải tệp lên */}
            {renderMenuItem(
                'Tải tệp lên', 
                'UPLOAD_FILE', 
                <FaFileUpload className={perms.canUploadFile ? "text-blue-500" : "text-gray-400"} />, 
                perms.canUploadFile
            )}

            {/* Tải thư mục lên */}
            {renderMenuItem(
                'Tải thư mục lên', 
                'UPLOAD_FOLDER', 
                <FaFolderOpen className={perms.canUploadFolder ? "text-gray-500" : "text-gray-400"} />, 
                perms.canUploadFolder,
                true // border-top
            )}
        </div>
    );
};

export default DashboardPage;