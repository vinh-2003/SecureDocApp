import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import fileService from '../../services/fileService';
import userService from '../../services/userService';
import { toast } from 'react-toastify';
import { 
    FaArrowLeft, FaList, FaThLarge, FaTimes, FaExchangeAlt, FaTrash,
    FaFolder, FaFilePdf, FaFileWord, FaFileAlt, FaFileImage, FaFileExcel
} from 'react-icons/fa';

import Loading from '../../components/Loading';
import FileExplorer from '../../components/FileExplorer/FileExplorer'; // Import Component Mới
import ItemContextMenu from '../../components/Dashboard/ItemContextMenu'; 
import MoveFileModal from '../../components/Dashboard/MoveFileModal';
import DeleteConfirmModal from '../../components/Dashboard/DeleteConfirmModal';

import { useFileSelection } from '../../hooks/useFileSelection'; // Import Hook Mới

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // STATE CHO CHẾ ĐỘ XEM: 'list' | 'grid'
  const [viewMode, setViewMode] = useState('list');

  // --- STATE ĐỂ LƯU TÊN HIỂN THỊ (Resolve từ ID) ---
  const [resolvedNames, setResolvedNames] = useState({
      ownerName: '',
      folderName: ''
  });

  // --- STATE TƯƠNG TÁC (Giống Dashboard) ---
  const [itemMenu, setItemMenu] = useState({ visible: false, x: 0, y: 0, file: null });
  
  // State Modals
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState([]);

  // Biến này dùng để render UI (Filter Chips)
  const currentParams = Object.fromEntries([...searchParams]);

  // --- SỬ DỤNG CUSTOM HOOK ---
  const { 
      selectedItems, toggleSelection, selectRange, selectAll, clearSelection, setLastSelectedIndex
  } = useFileSelection(results);

  // 1. USE EFFECT: SEARCH DATA (Khi URL đổi)
  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        // LỌC BỎ các field DisplayName nếu lỡ có lọt vào, không gửi lên API
        const { ownerDisplayName, locationDisplayName, ...cleanParams } = Object.fromEntries([...searchParams]);
        
        const apiParams = { ...cleanParams, page: 0, size: 50 };
        const res = await fileService.searchFiles(apiParams);
        if (res.success) setResults(res.data);

        // --- LOGIC F5: KHÔI PHỤC TÊN TỪ ID ---
        resolveFilterNames(cleanParams);

      } catch (error) { 
        console.error("Lỗi tìm kiếm:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    
    fetchSearchResults();
  }, [searchParams]);

  // Hàm phụ: Gọi API lấy tên từ ID (Chỉ gọi khi cần)
  const resolveFilterNames = async (params) => {
      const newNames = { ownerName: '', folderName: '' };
      const promises = [];

      // 1. Resolve Owner Name
      if (params.ownerId) {
          // Nếu param có ownerDisplayName (do Header truyền qua state - React Router state) thì dùng luôn
          // Nhưng ở đây ta đang dùng URL params thuần túy, nên gọi API
          promises.push(
              userService.getUserById(params.ownerId)
                  .then(res => { if(res.success) newNames.ownerName = res.data.fullName || res.data.username; })
                  .catch(() => newNames.ownerName = params.ownerId) // Fallback hiện ID nếu lỗi
          );
      }

      // 2. Resolve Folder Name
      if (params.locationId) {
          promises.push(
              fileService.getFolderInfo(params.locationId) // Hàm gọi API breadcrumb
                  .then(res => { 
                      if(res.success && res.data.length > 0) {
                          // Breadcrumb trả về [Root, ... , CurrentFolder]
                          // Lấy phần tử cuối cùng là folder hiện tại
                          const currentFolder = res.data[res.data.length - 1];
                          newNames.folderName = currentFolder.name;
                      }
                  })
                  .catch(() => newNames.folderName = params.locationId)
          );
      }

      if (promises.length > 0) {
          await Promise.all(promises);
          setResolvedNames(newNames);
      } else {
          setResolvedNames({ ownerName: '', folderName: '' });
      }
  };

  // --- XỬ LÝ FILTER CHIPS ---
  const handleRemoveFilter = (key) => {
      const newParams = { ...currentParams };
      // Xóa các key param
      if (key === 'fileType') delete newParams.fileType;
      if (key === 'ownerId') delete newParams.ownerId;
      if (key === 'locationId') delete newParams.locationId;
      if (key === 'dateRange') { delete newParams.fromDate; delete newParams.toDate; }
      if (key === 'inTrash') delete newParams.inTrash;
      
      // Xóa sạch các key rác nếu có
      delete newParams.ownerDisplayName;
      delete newParams.locationDisplayName;

      setSearchParams(newParams);
  };

  const handleClearAll = () => {
      if (currentParams.keyword) {
          setSearchParams({ keyword: currentParams.keyword });
      } else {
          setSearchParams({});
      }
  };

  useEffect(() => {
    const handleClick = () => {
        setItemMenu({ ...itemMenu, visible: false });
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [itemMenu]);

  // Helper Labels
  const getFilterLabel = (key, value) => {
    if (key === 'fileType') return `Loại: ${value === 'FOLDER' ? 'Thư mục' : '.' + value.toUpperCase()}`;
    
    // Dùng state đã fetch được để hiển thị
    if (key === 'ownerId') return `Người tạo: ${resolvedNames.ownerName || value}`; 
    if (key === 'locationId') return `Folder: ${resolvedNames.folderName || value}`;
    
    if (key === 'inTrash') return 'Trong thùng rác';
    return '';
  };

  // Helper Icons (Đồng bộ style với Dashboard)
  // eslint-disable-next-line
  const getFileIcon = (type, extension, isLarge = false) => {
    // Dashboard dùng text-5xl cho Grid và text-2xl cho List
    const sizeClass = isLarge ? "text-5xl mb-2" : "text-2xl"; 
    
    if (type === 'FOLDER') return <FaFolder className={`text-yellow-500 ${sizeClass}`} />;
    
    const ext = extension?.toLowerCase();
    if (ext === 'pdf') return <FaFilePdf className={`text-red-500 ${sizeClass}`} />;
    if (['doc', 'docx'].includes(ext)) return <FaFileWord className={`text-blue-500 ${sizeClass}`} />;
    if (['xls', 'xlsx'].includes(ext)) return <FaFileExcel className={`text-green-600 ${sizeClass}`} />;
    if (['jpg', 'png', 'jpeg'].includes(ext)) return <FaFileImage className={`text-purple-500 ${sizeClass}`} />;
    
    return <FaFileAlt className={`text-gray-400 ${sizeClass}`} />;
  };

  // eslint-disable-next-line
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

  // --- HANDLERS TỪ FILE EXPLORER GỬI LÊN ---
  
  // 1. Xử lý chọn file (Wrapper cho Hook)
  const handleSelect = (file, index, multi, range) => {
      if (range) {
          selectRange(index, results);
      } else {
          toggleSelection(file, multi);
          setLastSelectedIndex(index);
      }
  };

  // 2. Xử lý mở file (Navigation)
  const handleNavigate = (file) => {
      if (file.type === 'FOLDER') {
          navigate(`/folders/${file.id}`);
      } else {
          // Logic xem/tải
          if (['pdf', 'doc', 'docx'].some(ext => file.extension?.includes(ext) || file.mimeType?.includes(ext))) {
              navigate(`/file/view/${file.id}`);
          } else {
              handleDownload(file);
          }
      }
  };

  // 3. Xử lý Menu Chuột phải
  const handleContextMenu = (e, file) => {
      e.preventDefault();
      setItemMenu({ visible: true, x: e.pageX, y: e.pageY, file: file });
  };

  // 4. Xử lý nút 3 chấm
  const handleMenuBtnClick = (e, file) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setItemMenu({ visible: true, x: rect.left, y: rect.bottom, file: file });
  };

  // 5. Action Menu
  const handleMenuAction = (action, file) => {
      setItemMenu({ ...itemMenu, visible: false });
      switch (action) {
          case 'MOVE':
              clearSelection(); // Reset chọn cũ
              toggleSelection(file, true); // Chọn file này
              setShowMoveModal(true);
              break;
          case 'TRASH':
              setFilesToDelete([file]);
              setShowDeleteModal(true);
              break;
          case 'DOWNLOAD':
              handleDownload(file);
              break;
          default: break;
      }
  };

  // --- 1. HÀM XỬ LÝ TẢI XUỐNG ---
  const handleDownload = async (file) => {
    const toastId = toast.loading(`Đang chuẩn bị tải: ${file.name}...`);
    try {
      const response = await fileService.downloadFile(file.id);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss(toastId);
      toast.success("Đã tải xuống thành công!");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Lỗi khi tải file.");
    }
  };

  return (
    <div className="p-6 animate-fade-in pb-20">
      {/* 1. Header & Back */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
            <FaArrowLeft />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Kết quả tìm kiếm</h1>
            {currentParams.keyword && <p className="text-sm text-gray-500">Từ khóa: <span className="font-bold">"{currentParams.keyword}"</span></p>}
        </div>
      </div>

      {/* 2. FILTER CHIPS */}
      {(currentParams.fileType || currentParams.ownerId || currentParams.locationId || currentParams.inTrash || currentParams.fromDate) && (
          <div className="flex flex-wrap gap-2 mb-6 items-center">
              <span className="text-xs text-gray-500 font-medium mr-1">Bộ lọc:</span>

              {currentParams.fileType && (
                  <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs border border-blue-100 shadow-sm">
                      {getFilterLabel('fileType', currentParams.fileType)}
                      <button onClick={() => handleRemoveFilter('fileType')} className="hover:text-blue-900 rounded-full p-0.5"><FaTimes /></button>
                  </div>
              )}
              {currentParams.ownerId && (
                  <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs border border-purple-100 shadow-sm">
                      {getFilterLabel('ownerId', currentParams.ownerId)}
                      <button onClick={() => handleRemoveFilter('ownerId')} className="hover:text-purple-900 rounded-full p-0.5"><FaTimes /></button>
                  </div>
              )}
              {currentParams.locationId && (
                  <div className="flex items-center gap-1 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs border border-orange-100 shadow-sm">
                      {getFilterLabel('locationId', currentParams.locationId)}
                      <button onClick={() => handleRemoveFilter('locationId')} className="hover:text-orange-900 rounded-full p-0.5"><FaTimes /></button>
                  </div>
              )}
              {(currentParams.fromDate || currentParams.toDate) && (
                  <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs border border-green-100 shadow-sm">
                      {currentParams.fromDate || '...'} &#8594; {currentParams.toDate || '...'}
                      <button onClick={() => handleRemoveFilter('dateRange')} className="hover:text-green-900 rounded-full p-0.5"><FaTimes /></button>
                  </div>
              )}
              {currentParams.inTrash === 'true' && (
                  <div className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs border border-red-100 shadow-sm">
                      Trong thùng rác
                      <button onClick={() => handleRemoveFilter('inTrash')} className="hover:text-red-900 rounded-full p-0.5"><FaTimes /></button>
                  </div>
              )}

              <button onClick={handleClearAll} className="text-xs text-gray-500 hover:text-red-600 hover:underline ml-2">Xóa bộ lọc</button>
          </div>
      )}

      {/* 3. TOOLBAR (RESULT COUNT + VIEW TOGGLE) */}
      <div className="flex justify-between items-center mb-4">
          <p className="text-gray-500 text-sm">
              Tìm thấy <span className="font-bold text-blue-600">{results.length}</span> kết quả phù hợp.
          </p>

          {/* View Mode Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Danh sách"
                >
                    <FaList size={16} />
                </button>
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Lưới"
                >
                    <FaThLarge size={16} />
                </button>
          </div>
      </div>

      {/* TOOLBAR */}
            {selectedItems.length > 0 && (
                <div className="flex items-center gap-3 bg-blue-50 p-2 rounded-lg border border-blue-200 w-full animate-fade-in">
                    <span className="font-bold text-blue-800 text-sm ml-2">{selectedItems.length} đã chọn</span>
                    <button onClick={clearSelection} className="text-xs text-blue-600 hover:underline">Bỏ chọn</button>
                    <div className="flex-1 text-right gap-2 flex justify-end">
                        <button onClick={() => setShowMoveModal(true)} className="flex items-center gap-2 px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50"><FaExchangeAlt/> Di chuyển</button>
                        <button onClick={() => { setFilesToDelete(selectedItems); setShowDeleteModal(true); }} className="flex items-center gap-2 px-3 py-1 bg-white border border-red-200 text-red-600 rounded text-sm hover:bg-red-50"><FaTrash/> Xóa</button>
                    </div>
                </div>
            )}

        {/* --- SỬ DỤNG COMPONENT TÁI SỬ DỤNG --- */}
        {loading ? <Loading /> : (
            <FileExplorer 
                files={results}
                viewMode={viewMode}
                selectedItems={selectedItems}
                onSelect={handleSelect}
                onSelectAll={selectAll}
                onNavigate={handleNavigate}
                onContextMenu={handleContextMenu}
                onMenuAction={handleMenuBtnClick}
                showOwner={true} // Bật cột Owner cho trang tìm kiếm
            />
        )}

        {/* Modals & Menus */}
        <ItemContextMenu 
            menuState={itemMenu}
            onClose={() => setItemMenu({ ...itemMenu, visible: false })}
            onAction={handleMenuAction}
        />
        <MoveFileModal 
            isOpen={showMoveModal}
            onClose={() => setShowMoveModal(false)}
            selectedItems={selectedItems}
            onSuccess={() => { /* Reload data */ }}
        />

      <DeleteConfirmModal 
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => { /* Logic delete */ }}
          count={filesToDelete.length}
          isPermanent={false}
      />
    </div>
  );
};

export default SearchPage;