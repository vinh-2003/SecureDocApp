import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import fileService from '../../services/fileService';
import userService from '../../services/userService';
import { formatDate, formatBytes } from '../../utils/format';
// Thêm FaList, FaThLarge
import { 
  FaFileAlt, FaFilePdf, FaFileWord, FaFileImage, FaFolder, 
  FaArrowLeft, FaTimes, FaFileExcel, FaSearch, FaList, FaThLarge 
} from 'react-icons/fa';
import Loading from '../../components/Loading';

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

  // Biến này dùng để render UI (Filter Chips)
  const currentParams = Object.fromEntries([...searchParams]);

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

  // Helper Labels
  const getFilterLabel = (key, value) => {
    if (key === 'fileType') return `Loại: ${value === 'FOLDER' ? 'Thư mục' : '.' + value.toUpperCase()}`;
    
    // Dùng state đã fetch được để hiển thị
    if (key === 'ownerId') return `Người tạo: ${resolvedNames.ownerName || value}`; 
    if (key === 'locationId') return `Folder: ${resolvedNames.folderName || value}`;
    
    if (key === 'inTrash') return 'Trong thùng rác';
    return '';
  };

  // Helper Icons (Cập nhật để hỗ trợ size lớn cho Grid view)
  const getFileIcon = (type, extension, isLarge = false) => {
    const sizeClass = isLarge ? "text-5xl" : "text-xl";
    
    if (type === 'FOLDER') return <FaFolder className={`text-yellow-500 ${sizeClass}`} />;
    
    const ext = extension?.toLowerCase();
    if (ext === 'pdf') return <FaFilePdf className={`text-red-500 ${sizeClass}`} />;
    if (['doc', 'docx'].includes(ext)) return <FaFileWord className={`text-blue-500 ${sizeClass}`} />;
    if (['xls', 'xlsx'].includes(ext)) return <FaFileExcel className={`text-green-600 ${sizeClass}`} />;
    if (['jpg', 'png'].includes(ext)) return <FaFileImage className={`text-purple-500 ${sizeClass}`} />;
    
    return <FaFileAlt className={`text-gray-400 ${sizeClass}`} />;
  };

  // Handler click item
  const handleItemClick = (file) => {
    if(file.type === 'FOLDER') navigate(`/folders/${file.id}`);
    else console.log("Xem file", file.id);
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

      {/* 4. RESULTS DISPLAY */}
      {loading ? <Loading /> : (
        <>
            {results.length > 0 ? (
                <>
                    {/* --- LIST VIEW --- */}
                    {viewMode === 'list' && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3 border-b">Tên</th>
                                    <th className="px-6 py-3 border-b">Loại</th>
                                    <th className="px-6 py-3 border-b">Kích thước</th>
                                    <th className="px-6 py-3 border-b">Ngày sửa đổi</th>
                                </tr>
                                </thead>
                                <tbody className="text-gray-700 text-sm">
                                {results.map((file) => (
                                    <tr key={file.id} onClick={() => handleItemClick(file)} className="hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition">
                                    <td className="px-6 py-3 flex items-center gap-3">
                                        {getFileIcon(file.type, file.extension)}
                                        <div className="overflow-hidden">
                                            <span className="font-medium truncate block max-w-md text-gray-800" title={file.name}>{file.name || file.title}</span>
                                            {file.ancestors && <span className="text-[10px] text-gray-400">/{file.ancestors.join('/')}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 uppercase text-xs font-semibold text-gray-500">{file.extension || 'FOLDER'}</td>
                                    <td className="px-6 py-3 text-xs">{file.type === 'FOLDER' ? '--' : formatBytes(file.size)}</td>
                                    <td className="px-6 py-3">{formatDate(file.updatedAt)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* --- GRID VIEW --- */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
                            {results.map((file) => (
                                <div 
                                    key={file.id} 
                                    onClick={() => handleItemClick(file)}
                                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col items-center text-center transition group relative"
                                >
                                    <div className="mt-2 mb-3 transform group-hover:scale-110 transition duration-200">
                                        {/* Icon lớn cho Grid */}
                                        {getFileIcon(file.type, file.extension, true)}
                                    </div>
                                    
                                    <p className="text-sm font-medium text-gray-800 truncate w-full px-1 mb-1" title={file.name || file.title}>
                                        {file.name || file.title}
                                    </p>
                                    
                                    <p className="text-xs text-gray-500">
                                        {file.type === 'FOLDER' ? 'Thư mục' : formatBytes(file.size)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {formatDate(file.updatedAt).split(' ')[0]}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 flex flex-col items-center justify-center text-gray-500 animate-fade-in">
                    <FaSearch className="text-4xl text-gray-200 mb-3" />
                    <p>Không tìm thấy tài liệu nào khớp với tiêu chí.</p>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default SearchPage;