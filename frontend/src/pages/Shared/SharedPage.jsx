import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaShareAlt } from 'react-icons/fa';

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
import { SHARED_COLUMNS, SHARED_VISIBLE_COLUMNS } from '../../constants';

const SharedPage = () => {
    // 1. ROUTER & CONTEXT
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId;

    // 2. LOCAL STATE
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [viewMode, setViewMode] = useState('list');
    const [visibleColumns, setVisibleColumns] = useState(SHARED_VISIBLE_COLUMNS);

    // 3. INFINITE SCROLL REF
    const observer = useRef();
    const lastElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // 4. CUSTOM HOOKS

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
    } = useFileSelection(files);

    // File Icon
    const { isProcessing, isFailed } = useFileIcon();

    // File Actions
    const fileActions = useFileActions({
        onRefresh: () => {
            // Reset và reload từ đầu
            setFiles([]);
            setPage(0);
            setHasMore(true);
        },
        setSelection,
        handleRename: async (item, newName) => {
            try {
                const res = await fileService.renameFile(item.id, newName);
                if (res.success) {
                    toast.success("Đổi tên thành công!");
                    // Cập nhật local state
                    setFiles(prev => prev.map(f =>
                        f.id === item.id ? { ...f, name: newName } : f
                    ));
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
                    setFiles(prev => prev.map(f =>
                        f.id === item.id ? { ...f, description } : f
                    ));
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
        onDoubleClick: (file) => handleNavigate(file),
        onCtrlClick: (e, file, index) => selectWithCtrl(e, file, index),
        onShiftClick: (e, file, index) => selectWithShift(index),
        clickDelay: 250
    });

    // 5. HANDLERS

    // Wrapper cho click
    const handleSmartClickWrapper = (e, file, index) => {
        if (isProcessing(file) || isFailed(file)) return;
        handleSmartClick(e, file, index);
    };

    const handleDoubleClick = (file) => {
        if (isProcessing(file) || isFailed(file)) return;
        handleDoubleClickBase(file);
    };

    // Navigation
    const handleNavigate = (file) => {
        if (file.type === 'FOLDER') {
            navigate(`/folders/${file.id}`);
        } else {
            const isViewable =
                file.mimeType === 'application/pdf' ||
                file.name?.toLowerCase().endsWith('.docx') ||
                file.name?.toLowerCase().endsWith('.doc');

            if (isViewable) {
                navigate(`/file/view/${file.id}`);
            } else {
                fileActions.handleDownload(file);
            }
        }
    };

    // Menu Action
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

    // 6. DATA FETCHING
    useEffect(() => {
        const fetchShared = async () => {
            setLoading(true);
            try {
                const limit = 20;
                const res = await fileService.getSharedFiles(page, limit);

                if (res.success) {
                    const newFiles = res.data;

                    // Nếu dữ liệu trả về ít hơn limit -> Hết dữ liệu
                    if (newFiles.length < limit) setHasMore(false);

                    // Nối dữ liệu (Dùng Map để lọc trùng ID nếu mạng lag)
                    setFiles(prev => {
                        const uniqueMap = new Map();
                        [...prev, ...newFiles].forEach(f => uniqueMap.set(f.id, f));
                        return Array.from(uniqueMap.values());
                    });
                }
            } catch (error) {
                console.error("Lỗi tải file chia sẻ", error);
                toast.error("Không thể tải danh sách chia sẻ.");
            } finally {
                setLoading(false);
            }
        };

        fetchShared();
    }, [page]);

    // 7. RENDER
    return (
        <div className="animate-fade-in pb-10 min-h-[80vh]">

            {/* HEADER */}
            <PageHeader
                icon={<FaShareAlt className="text-blue-600" />}
                title="Được chia sẻ với tôi"
                subtitle="Các tập tin và thư mục bạn có quyền truy cập"
                actions={
                    <div className="flex items-center gap-3">
                        {/* Column Toggle - Chỉ hiện ở List View */}
                        {viewMode === 'list' && (
                            <ColumnToggle
                                allColumns={SHARED_COLUMNS}
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

            {/* BATCH ACTIONS */}
            <BatchActionBar
                selectedCount={selectionCount}
                selectedFiles={selectedFiles}
                onClearSelection={clearSelection}
                onAction={handleBatchAction}
                actions={[BATCH_ACTIONS.MOVE, BATCH_ACTIONS.DELETE]}
            />

            {/* MAIN CONTENT */}
            {files.length === 0 && !loading ? (
                <EmptyState type="shared" />
            ) : (
                <>
                    {viewMode === 'list' ? (
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
                            onRetry={(e, file) => fileActions.handleRetry(e, file, setFiles)}
                            lastElementRef={lastElementRef}
                        />
                    ) : (
                        <FileGridView
                            files={files}
                            isSelected={isSelected}
                            onToggleSelect={toggleSelect}
                            onCardClick={handleSmartClickWrapper}
                            onDoubleClick={handleDoubleClick}
                            onContextMenu={openItemMenu}
                            onMenuClick={openItemMenuFromButton}
                            onRetry={(e, file) => fileActions.handleRetry(e, file, setFiles)}
                            lastElementRef={lastElementRef}
                        />
                    )}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="py-6 flex justify-center">
                            <Loading />
                        </div>
                    )}

                    {/* End of List */}
                    {!hasMore && files.length > 0 && (
                        <div className="py-6 text-center text-xs text-gray-400 uppercase tracking-widest">
                            — Hết danh sách —
                        </div>
                    )}
                </>
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

export default SharedPage;