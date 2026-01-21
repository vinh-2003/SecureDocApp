import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaTrash, FaHome, FaChevronRight } from 'react-icons/fa';

// Services & Context
import fileService from '../../services/fileService';
import { AuthContext } from '../../context/AuthContext';

// Components
import { ViewModeToggle, PageHeader, Loading } from '../../components/Common';
import {
    FileListView,
    FileGridView,
    EmptyState,
    ColumnToggle,
    BatchActionBar,
    BATCH_ACTIONS,
    GRID_INFO
} from '../../components/FileExplorer';
import {
    TrashContextMenu,
    FileInfoModal,
    DeleteConfirmModal
} from '../../components/Dashboard';

// Hooks
import {
    useContextMenu,
    useFileClick,
    useFileSelection,
    useFileIcon
} from '../../hooks';

// Constants
import { TRASH_COLUMNS, TRASH_VISIBLE_COLUMNS } from '../../constants';

const TrashPage = () => {
    // 1. ROUTER & CONTEXT
    const [searchParams, setSearchParams] = useSearchParams();
    const currentFolderId = searchParams.get('parentId');

    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId;

    // 2. LOCAL STATE
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [visibleColumns, setVisibleColumns] = useState(TRASH_VISIBLE_COLUMNS);

    // Breadcrumbs
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Thùng rác' }]);

    // Modal States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [filesToDelete, setFilesToDelete] = useState([]);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoData, setInfoData] = useState(null);
    const [infoLoading, setInfoLoading] = useState(false);

    // 3. CUSTOM HOOKS

    // Context Menu - Sử dụng riêng cho Trash
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
        clearSelection
    } = useFileSelection(files);

    // File Icon
    const { isProcessing, isFailed } = useFileIcon();

    // File Click
    const { handleSmartClick, handleDoubleClick: handleDoubleClickBase } = useFileClick({
        onSingleClick: (e, file, index) => selectSingle(file, index),
        onDoubleClick: (file) => {
            // Double click vào folder trong trash -> Mở xem nội dung bên trong
            if (file.type === 'FOLDER') {
                setSearchParams({ parentId: file.id });
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

    // Breadcrumb click
    const handleBreadcrumbClick = (item) => {
        if (!item.id) {
            setSearchParams({});
        } else {
            setSearchParams({ parentId: item.id });
        }
    };

    // Fetch file info
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

    // Restore files
    const handleRestore = async (filesToRestore) => {
        if (!filesToRestore || filesToRestore.length === 0) return;

        setActionLoading(true);
        const toastId = toast.loading("Đang khôi phục.. .");

        try {
            const ids = filesToRestore.map(f => f.id);
            const res = await fileService.restoreFiles(ids);

            if (res.success) {
                toast.update(toastId, {
                    render: `Đã khôi phục ${filesToRestore.length} mục. `,
                    type: "success",
                    isLoading: false,
                    autoClose: 2000
                });

                // Cập nhật UI
                setFiles(prev => prev.filter(f => !ids.includes(f.id)));
                clearSelection();
            }
        } catch (error) {
            toast.update(toastId, {
                render: "Khôi phục thất bại.",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Delete permanently - Mở modal
    const handleDeletePermanentClick = (filesToDel) => {
        if (!filesToDel || filesToDel.length === 0) return;
        setFilesToDelete(filesToDel);
        setShowDeleteModal(true);
    };

    // Delete permanently - Xác nhận
    const confirmDeletePermanent = async () => {
        if (filesToDelete.length === 0) return;

        setActionLoading(true);
        const toastId = toast.loading("Đang xóa vĩnh viễn...");

        try {
            const ids = filesToDelete.map(f => f.id);
            const res = await fileService.deletePermanently(ids);

            if (res.success) {
                toast.update(toastId, {
                    render: "Đã xóa vĩnh viễn.",
                    type: "success",
                    isLoading: false,
                    autoClose: 2000
                });

                // Cập nhật UI
                setFiles(prev => prev.filter(f => !ids.includes(f.id)));
                clearSelection();
                setShowDeleteModal(false);
                setFilesToDelete([]);
            }
        } catch (error) {
            toast.update(toastId, {
                render: "Xóa thất bại.",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Menu Action - Xử lý hành động từ context menu
    const handleMenuAction = (action, file) => {
        closeAllMenus();

        switch (action) {
            case 'RESTORE':
                handleRestore([file]);
                break;
            case 'DELETE_PERMANENT':
                handleDeletePermanentClick([file]);
                break;
            case 'INFO':
                fetchFileInfo(file);
                break;
            default:
                break;
        }
    };

    // Batch Action - Xử lý hành động hàng loạt
    const handleBatchAction = (actionType) => {
        if (actionType === BATCH_ACTIONS.RESTORE) {
            handleRestore(selectedFiles);
        } else if (actionType === BATCH_ACTIONS.DELETE_PERMANENT) {
            handleDeletePermanentClick(selectedFiles);
        }
    };

    // 5. DATA FETCHING
    useEffect(() => {
        fetchTrashFiles();
        clearSelection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFolderId]);

    const fetchTrashFiles = async () => {
        setLoading(true);
        try {
            const res = await fileService.getTrashFiles(currentFolderId);

            if (res.success) {
                setFiles(res.data);

                // Cập nhật breadcrumb
                if (currentFolderId) {
                    // Nếu API trả về thông tin folder cha, dùng tên thật
                    // Tạm thời hiển thị generic
                    setBreadcrumbs([
                        { id: null, name: 'Thùng rác' },
                        { id: currentFolderId, name: 'Thư mục con' }
                    ]);
                } else {
                    setBreadcrumbs([{ id: null, name: 'Thùng rác' }]);
                }
            }
        } catch (error) {
            toast.error("Không thể tải thùng rác.");
        } finally {
            setLoading(false);
        }
    };

    // 6. RENDER
    return (
        <div className="animate-fade-in pb-10 min-h-[80vh]">

            {/* HEADER */}
            <PageHeader
                icon={<FaTrash className="text-red-500" />}
                title="Thùng rác"
                subtitle="Các mục đã xóa sẽ được lưu ở đây trong 30 ngày"
                actions={
                    <div className="flex items-center gap-3">
                        {/* Column Toggle - Chỉ hiện ở List View */}
                        {viewMode === 'list' && (
                            <ColumnToggle
                                allColumns={TRASH_COLUMNS}
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
                }
            />

            {/* BREADCRUMB */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                {breadcrumbs.map((item, index) => (
                    <React.Fragment key={item.id || 'root'}>
                        <button
                            onClick={() => handleBreadcrumbClick(item)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors
                                ${index === breadcrumbs.length - 1
                                    ? 'font-bold text-gray-800 bg-red-50'
                                    : 'hover:bg-gray-100 text-gray-600'
                                }
                            `}
                        >
                            {index === 0 && <FaHome className="text-gray-500" />}
                            <span>{item.name}</span>
                        </button>
                        {index < breadcrumbs.length - 1 && (
                            <FaChevronRight className="text-gray-300 text-xs" />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* BATCH ACTIONS */}
            <BatchActionBar
                selectedCount={selectionCount}
                selectedFiles={selectedFiles}
                onClearSelection={clearSelection}
                onAction={handleBatchAction}
                actions={[BATCH_ACTIONS.RESTORE, BATCH_ACTIONS.DELETE_PERMANENT]}
                variant="trash"
            />

            {/* MAIN CONTENT */}
            {loading ? <Loading /> : (
                files.length > 0 ? (
                    viewMode === 'list' ? (
                        <FileListView
                            files={files}
                            visibleColumns={visibleColumns}
                            isSelected={isSelected}
                            isAllSelected={isAllSelected}
                            onSelectAll={selectAll}
                            onToggleSelect={toggleSelect}
                            onRowClick={handleSmartClickWrapper}
                            onDoubleClick={handleDoubleClick}
                            onContextMenu={openItemMenu}
                            onMenuClick={openItemMenuFromButton}
                        />
                    ) : (
                        <FileGridView
                            files={files}
                            visibleInfo={[GRID_INFO.DELETED_AT]}
                            isSelected={isSelected}
                            onToggleSelect={toggleSelect}
                            onCardClick={handleSmartClickWrapper}
                            onDoubleClick={handleDoubleClick}
                            onContextMenu={openItemMenu}
                            onMenuClick={openItemMenuFromButton}
                        />
                    )
                ) : (
                    <EmptyState type="trash" />
                )
            )}

            {/* CONTEXT MENU - Sử dụng TrashContextMenu */}
            <TrashContextMenu
                menuState={itemMenu}
                onClose={closeItemMenu}
                onAction={handleMenuAction}
            />

            {/* MODALS */}

            {/* Modal Thông tin Chi tiết */}
            <FileInfoModal
                isOpen={showInfoModal}
                onClose={() => setShowInfoModal(false)}
                data={infoData}
                loading={infoLoading}
                currentUserId={currentUserId}
            />

            {/* Modal Xóa Vĩnh Viễn */}
            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setFilesToDelete([]);
                }}
                onConfirm={confirmDeletePermanent}
                count={filesToDelete.length}
                isLoading={actionLoading}
                isPermanent={true}
            />
        </div>
    );
};

export default TrashPage;