import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaMagic, FaImage, FaTimes } from 'react-icons/fa';

// Services
import fileService from '../../services/fileService';
import userService from '../../services/userService';

// Context
import { AuthContext } from '../../context/AuthContext';

// Components
import { ViewModeToggle, FilterChips, Loading } from '../../components/Common';
import {
    FileListView,
    FileGridView,
    EmptyState,
    ColumnToggle,
    BatchActionBar,
    BATCH_ACTIONS
} from '../../components/FileExplorer';
import {
    ItemContextMenu,
    MoveFileModal,
    DeleteConfirmModal,
    RenameModal,
    DescriptionModal,
    FileInfoModal,
    ShareModal,
    ConfirmRevokeModal
} from '../../components/Dashboard';

// Hooks
import {
    useContextMenu,
    useFileClick,
    useFileSelection,
    useFileActions,
    useFileIcon
} from '../../hooks';

// Constants
import { SEARCH_COLUMNS, SEARCH_VISIBLE_COLUMNS } from '../../constants';

const SearchPage = () => {
    // 1. ROUTER & CONTEXT
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId;

    // 2. LOCAL STATE
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [visibleColumns, setVisibleColumns] = useState(SEARCH_VISIBLE_COLUMNS);

    // [MỚI] State cho AI Search
    const [isSemantic, setIsSemantic] = useState(false); // Toggle chế độ Semantic
    const [imageSearchState, setImageSearchState] = useState(null); // Lưu trạng thái tìm ảnh

    // State lưu tên đã resolve từ ID
    const [resolvedNames, setResolvedNames] = useState({
        ownerName: '',
        folderName: ''
    });

    // Lấy params hiện tại
    const currentParams = useMemo(() =>
        Object.fromEntries([...searchParams]),
        [searchParams]
    );

    // Fetch search results
    async function fetchSearchResults() {
        setLoading(true);
        try {
            // CASE A: Tìm kiếm bằng hình ảnh (Ưu tiên số 1)
            // Nếu có dữ liệu từ location.state (do Header gửi sang)
            if (location.state?.searchType === 'IMAGE') {
                setResults(location.state.imageResults);
                setImageSearchState({
                    imageName: location.state.imageName,
                    imagePreview: location.state.imagePreview
                });
                setLoading(false);
                return; // Dừng, không gọi API text nữa
            } else {
                setImageSearchState(null); // Reset nếu không phải image search
            }

            // CASE B: Tìm kiếm Text (Keyword hoặc Semantic)
            const { ownerDisplayName, locationDisplayName, ...cleanParams } = currentParams;

            let res;

            // Nếu bật chế độ Semantic VÀ có từ khóa
            if (isSemantic && cleanParams.keyword) {
                // Gọi API Semantic
                res = await fileService.searchBySemantic(cleanParams.keyword);
            } else {
                // Gọi API Thường (Keyword + Filters)
                const apiParams = { ...cleanParams, page: 0, size: 50 };
                res = await fileService.searchFiles(apiParams);
            }

            if (res.success) {
                setResults(res.data);
            }

            // Resolve tên người dùng/folder (cho bộ lọc)
            await resolveFilterNames(cleanParams);

        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
            toast.error("Không thể tìm kiếm.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSearchResults();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, location.state, isSemantic]);

    // 3. CUSTOM HOOKS

    // Context Menu
    const {
        itemMenu,
        openItemMenu,
        openItemMenuFromButton,
        closeItemMenu,
        closeAllMenus
    } = useContextMenu();

    // File Selection
    const {
        selectedFiles,
        isSelected,
        isAllSelected,
        selectionCount,
        toggleSelect,
        selectSingle,
        selectWithCtrl,
        selectWithShift,
        selectAll,
        clearSelection,
        setSelection
    } = useFileSelection(results);

    // File Icon
    const { isProcessing, isFailed } = useFileIcon();

    // File Actions - Tận dụng hook đã có (không cần handleRename, handleUpdateDescription từ context)
    const fileActions = useFileActions({
        onRefresh: fetchSearchResults,
        setSelection,
        // Các hàm này sẽ được xử lý local trong hook
        handleRename: async (item, newName) => {
            try {
                const res = await fileService.renameFile(item.id, newName);
                if (res.success) {
                    toast.success("Đổi tên thành công!");
                    return true;
                }
            } catch (error) {
                toast.error(error.response?.data?.message || "Lỗi khi đổi tên.");
            }
            return false;
        },
        handleUpdateDescription: async (item, description) => {
            try {
                const res = await fileService.updateDescription(item.id, description);
                if (res.success) {
                    toast.success("Cập nhật mô tả thành công!");
                    return true;
                }
            } catch (error) {
                toast.error("Lỗi khi cập nhật mô tả.");
            }
            return false;
        }
    });

    // File Click
    const { handleSmartClick, handleDoubleClick: handleDoubleClickBase } = useFileClick({
        onSingleClick: (e, file, index) => selectSingle(file, index),
        onDoubleClick: (file) => {
            if (file.type === 'FOLDER') {
                clearSelection();
                navigate(`/folders/${file.id}`);
            } else {
                fileActions.handleFileClick(file);
            }
        },
        onCtrlClick: (e, file, index) => selectWithCtrl(e, file, index),
        onShiftClick: (e, file, index) => selectWithShift(index),
        clickDelay: 250
    });

    // 4. HANDLERS

    // Wrapper cho click
    const handleSmartClickWrapper = (e, file, index) => {
        if (isProcessing(file) || isFailed(file)) return;
        handleSmartClick(e, file, index);
    };

    const handleDoubleClick = (file) => {
        if (isProcessing(file) || isFailed(file)) return;
        handleDoubleClickBase(file);
    };

    // Menu Action - Sử dụng fileActions
    const handleMenuAction = (action, file) => {
        fileActions.handleMenuAction(action, file, closeAllMenus);
    };

    // Batch Action
    const handleBatchAction = (actionType) => {
        if (actionType === BATCH_ACTIONS.MOVE) {
            fileActions.openMoveModal(selectedFiles);
        } else if (actionType === BATCH_ACTIONS.DELETE) {
            fileActions.handleSoftDelete(selectedFiles);
        }
    };

    // 5. FILTER LOGIC

    // Build filters cho FilterChips
    const filters = useMemo(() => {
        const list = [];

        if (currentParams.fileType) {
            list.push({
                key: 'fileType',
                label: `Loại:  ${currentParams.fileType === 'FOLDER' ? 'Thư mục' : '.' + currentParams.fileType.toUpperCase()}`,
                color: 'blue'
            });
        }

        if (currentParams.ownerId) {
            list.push({
                key: 'ownerId',
                label: `Người tạo: ${resolvedNames.ownerName || currentParams.ownerId}`,
                color: 'purple'
            });
        }

        if (currentParams.locationId) {
            list.push({
                key: 'locationId',
                label: `Folder: ${resolvedNames.folderName || currentParams.locationId}`,
                color: 'orange'
            });
        }

        if (currentParams.fromDate || currentParams.toDate) {
            list.push({
                key: 'dateRange',
                label: `${currentParams.fromDate || '.. .'} → ${currentParams.toDate || '... '}`,
                color: 'green'
            });
        }

        if (currentParams.inTrash === 'true') {
            list.push({
                key: 'inTrash',
                label: 'Trong thùng rác',
                color: 'red'
            });
        }

        return list;
    }, [currentParams, resolvedNames]);

    // Remove filter
    const handleRemoveFilter = (key) => {
        const newParams = { ...currentParams };

        if (key === 'fileType') delete newParams.fileType;
        if (key === 'ownerId') delete newParams.ownerId;
        if (key === 'locationId') delete newParams.locationId;
        if (key === 'dateRange') {
            delete newParams.fromDate;
            delete newParams.toDate;
        }
        if (key === 'inTrash') delete newParams.inTrash;

        // Clean up display names
        delete newParams.ownerDisplayName;
        delete newParams.locationDisplayName;

        setSearchParams(newParams);
    };

    // Clear all filters
    const handleClearAllFilters = () => {
        if (currentParams.keyword) {
            setSearchParams({ keyword: currentParams.keyword });
        } else {
            setSearchParams({});
        }
    };

    // 6. DATA FETCHING

    // Resolve names from IDs
    const resolveFilterNames = async (params) => {
        const newNames = { ownerName: '', folderName: '' };
        const promises = [];

        if (params.ownerId) {
            promises.push(
                userService.getUserById(params.ownerId)
                    .then(res => {
                        if (res.success) {
                            newNames.ownerName = res.data.fullName || res.data.username;
                        }
                    })
                    .catch(() => {
                        newNames.ownerName = params.ownerId;
                    })
            );
        }

        if (params.locationId) {
            promises.push(
                fileService.getBreadcrumbs(params.locationId)
                    .then(res => {
                        if (res.success && res.data.length > 0) {
                            const currentFolder = res.data[res.data.length - 1];
                            newNames.folderName = currentFolder.name;
                        }
                    })
                    .catch(() => {
                        newNames.folderName = params.locationId;
                    })
            );
        }

        if (promises.length > 0) {
            await Promise.all(promises);
            setResolvedNames(newNames);
        } else {
            setResolvedNames({ ownerName: '', folderName: '' });
        }
    };

    // 7. RENDER
    return (
        <div className="animate-fade-in pb-10 min-h-[80vh]">

            {/* HEADER AREA */}
            <div className="flex flex-col gap-4 mb-6">
                {/* Row 1: Back + Title */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition"
                        title="Quay lại"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            {imageSearchState ? (
                                <>
                                    <FaImage className="text-purple-600" />
                                    Tìm kiếm bằng hình ảnh
                                </>
                            ) : (
                                "Kết quả tìm kiếm"
                            )}
                        </h1>
                        
                        {/* Subtitle logic */}
                        {imageSearchState ? (
                            <p className="text-sm text-gray-500 mt-1">
                                Kết quả tương đồng với: <span className="font-semibold text-gray-700">{imageSearchState.imageName}</span>
                            </p>
                        ) : currentParams.keyword && (
                            <p className="text-sm text-gray-500">
                                {isSemantic ? "Tìm kiếm ngữ nghĩa (AI) cho: " : "Từ khóa: "} 
                                <span className="font-bold">"{currentParams.keyword}"</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* [MỚI] AI TOGGLE BAR (Chỉ hiện khi tìm Text) */}
                {!imageSearchState && currentParams.keyword && (
                    <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100 self-start">
                        <div className="flex items-center gap-2 text-indigo-700 font-medium text-sm">
                            <FaMagic />
                            <span>Chế độ tìm kiếm:</span>
                        </div>
                        
                        <div className="flex bg-white rounded-md p-1 border border-indigo-100 shadow-sm">
                            <button
                                onClick={() => setIsSemantic(false)}
                                className={`px-3 py-1 text-xs font-semibold rounded transition ${
                                    !isSemantic 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                Chính xác
                            </button>
                            <button
                                onClick={() => setIsSemantic(true)}
                                className={`px-3 py-1 text-xs font-semibold rounded transition flex items-center gap-1 ${
                                    isSemantic 
                                    ? 'bg-purple-600 text-white shadow-sm' 
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                AI (Thông minh)
                            </button>
                        </div>
                    </div>
                )}

                {/* [MỚI] IMAGE SEARCH PREVIEW BAR */}
                {imageSearchState && imageSearchState.imagePreview && (
                    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200 self-start">
                        <img 
                            src={imageSearchState.imagePreview} 
                            alt="Preview" 
                            className="h-12 w-12 object-cover rounded border border-gray-300" 
                        />
                        <div className="text-sm">
                            <p className="font-medium text-gray-700">Ảnh đã tải lên</p>
                            <button 
                                onClick={() => {
                                    // Xóa state image và quay lại search thường
                                    navigate('/search', { replace: true, state: {} });
                                }}
                                className="text-xs text-red-500 hover:underline flex items-center gap-1 mt-0.5"
                            >
                                <FaTimes /> Hủy tìm ảnh
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* FILTER CHIPS (Chỉ hiện khi không phải Image Search) */}
            {!imageSearchState && (
                <FilterChips
                    filters={filters}
                    onRemove={handleRemoveFilter}
                    onClearAll={handleClearAllFilters}
                />
            )}

            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <p className="text-gray-500 text-sm self-start md:self-center">
                    Tìm thấy <span className="font-bold text-blue-600">{results.length}</span> kết quả phù hợp.
                </p>

                <div className="flex items-center gap-3 self-end md:self-center">
                    {/* Column Toggle - Chỉ hiện ở List View */}
                    {viewMode === 'list' && (
                        <ColumnToggle
                            allColumns={SEARCH_COLUMNS}
                            visibleColumns={visibleColumns}
                            onChange={setVisibleColumns}
                        />
                    )}

                    {/* View Mode */}
                    <ViewModeToggle
                        viewMode={viewMode}
                        onChange={setViewMode}
                    />
                </div>
            </div>

            {/* BATCH ACTIONS */}
            <BatchActionBar
                selectedCount={selectionCount}
                selectedFiles={selectedFiles}
                onClearSelection={clearSelection}
                onAction={handleBatchAction}
                actions={[BATCH_ACTIONS.MOVE, BATCH_ACTIONS.DELETE]}
            />

            {/* MAIN CONTENT */}
            {loading ? <Loading /> : (
                results.length > 0 ? (
                    viewMode === 'list' ? (
                        <FileListView
                            files={results}
                            visibleColumns={visibleColumns}
                            isSelected={isSelected}
                            isAllSelected={isAllSelected}
                            onSelectAll={selectAll}
                            onToggleSelect={toggleSelect}
                            onRowClick={handleSmartClickWrapper}
                            onDoubleClick={handleDoubleClick}
                            onContextMenu={openItemMenu}
                            onMenuClick={openItemMenuFromButton}
                            onRetry={(e, file) => fileActions.handleRetry(e, file, setResults)}
                        />
                    ) : (
                        <FileGridView
                            files={results}
                            isSelected={isSelected}
                            onToggleSelect={toggleSelect}
                            onCardClick={handleSmartClickWrapper}
                            onDoubleClick={handleDoubleClick}
                            onContextMenu={openItemMenu}
                            onMenuClick={openItemMenuFromButton}
                            onRetry={(e, file) => fileActions.handleRetry(e, file, setResults)}
                        />
                    )
                ) : (
                    <EmptyState type="search" />
                )
            )}

            {/* CONTEXT MENU */}
            <ItemContextMenu
                menuState={itemMenu}
                onClose={closeItemMenu}
                onAction={handleMenuAction}
            />

            {/* ========== MODALS ========== */}

            {/* Modal Đổi Tên */}
            <RenameModal
                isOpen={fileActions.showRenameModal}
                onClose={fileActions.closeRenameModal}
                onSubmit={() => fileActions.submitRename({ preventDefault: () => { } })}
                item={fileActions.renameData.item}
                value={fileActions.renameData.newName}
                onChange={(val) => fileActions.setRenameData({ ...fileActions.renameData, newName: val })}
            />

            {/* Modal Cập nhật Mô tả */}
            <DescriptionModal
                isOpen={fileActions.showDescModal}
                onClose={fileActions.closeDescModal}
                onSubmit={() => fileActions.submitDescription({ preventDefault: () => { } })}
                item={fileActions.descData.item}
                value={fileActions.descData.description}
                onChange={(val) => fileActions.setDescData({ ...fileActions.descData, description: val })}
            />

            {/* Modal Thông tin Chi tiết */}
            <FileInfoModal
                isOpen={fileActions.showInfoModal}
                onClose={fileActions.closeInfoModal}
                data={fileActions.infoData}
                loading={fileActions.infoLoading}
                currentUserId={currentUserId}
            />

            {/* Modal Chia sẻ */}
            <ShareModal
                isOpen={fileActions.showShareModal}
                onClose={fileActions.closeShareModal}
                data={fileActions.shareData}
                loading={fileActions.shareLoading}
                currentUserId={currentUserId}
                emailInput={fileActions.emailInput}
                onEmailChange={fileActions.setEmailInput}
                permissionInput={fileActions.permissionInput}
                onPermissionChange={fileActions.setPermissionInput}
                onAddUser={fileActions.handleAddUserShare}
                onRevokeClick={fileActions.clickRevoke}
                onUpdatePermission={fileActions.handleUpdatePermission}
                onChangePublicAccess={fileActions.handleChangePublicAccess}
                onCopyLink={fileActions.copyShareLink}
            />

            {/* Modal Xác nhận Gỡ quyền */}
            <ConfirmRevokeModal
                isOpen={fileActions.showConfirmRevokeModal}
                onClose={fileActions.closeConfirmRevokeModal}
                onConfirm={fileActions.confirmRevoke}
                user={fileActions.userToRevoke}
                loading={fileActions.revokeLoading}
            />

            {/* Modal Di chuyển */}
            <MoveFileModal
                isOpen={fileActions.showMoveModal}
                onClose={fileActions.closeMoveModal}
                selectedItems={selectedFiles}
                onSuccess={fileActions.handleMoveSuccess}
            />

            {/* Modal Xóa */}
            <DeleteConfirmModal
                isOpen={fileActions.showDeleteModal}
                onClose={fileActions.closeDeleteModal}
                onConfirm={fileActions.executeDelete}
                count={fileActions.filesToDelete.length}
                isLoading={fileActions.deleting}
                isPermanent={false}
            />
        </div>
    );
};

export default SearchPage;