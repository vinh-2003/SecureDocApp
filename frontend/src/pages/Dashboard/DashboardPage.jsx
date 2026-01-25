import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Services & Context
import fileService from '../../services/fileService';
import { FileContext } from '../../context/FileContext';
import { AuthContext } from '../../context/AuthContext';

// Components
import { Breadcrumb, Loading } from '../../components/Common';
import {
    ItemContextMenu,
    BackgroundContextMenu,
    MoveFileModal,
    DeleteConfirmModal,
    CreateFolderModal,
    RenameModal,
    DescriptionModal,
    FileInfoModal,
    ShareModal,
    ConfirmRevokeModal,
    DashboardStats,
    STAT_TYPES
} from '../../components/Dashboard';
import {
    FileListView,
    FileGridView,
    FileToolbar,
    EmptyState,
    BatchActionBar,
    BATCH_ACTIONS
} from '../../components/FileExplorer';

// Hooks
import {
    useContextMenu,
    useFileClick,
    useFileSelection,
    useFileActions,
    useFileIcon,
} from '../../hooks';
import { useFileWebSocket } from '../../hooks';

// Constants
import { DASHBOARD_COLUMNS, DEFAULT_VISIBLE_COLUMNS } from '../../constants';

const DashboardPage = () => {
    // 1. ROUTER & CONTEXT
    const { folderId } = useParams();
    const navigate = useNavigate();

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

    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId;

    // 2. LOCAL STATE
    const [files, setFiles] = useState([]);
    const [stats, setStats] = useState({ totalFiles: 0, totalSize: 0 });
    const [loading, setLoading] = useState(false);
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Tài liệu của tôi' }]);
    const [sortConfig, setSortConfig] = useState({ sortBy: 'updatedAt', direction: 'desc' });
    const [viewMode, setViewMode] = useState('list');
    const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);

    // 3. CUSTOM HOOKS
    const {
        contextMenu, itemMenu, breadcrumbMenu,
        openContextMenu, closeContextMenu,
        openItemMenu, openItemMenuFromButton, closeItemMenu,
        openBreadcrumbMenu, openBreadcrumbMenuFromContext, closeBreadcrumbMenu,
        closeAllMenus
    } = useContextMenu();

    const {
        selectedFiles, isSelected, isAllSelected, selectionCount,
        toggleSelect, selectSingle, selectWithCtrl, selectWithShift,
        selectAll, clearSelection, setSelection
    } = useFileSelection(files);

    const fileActions = useFileActions({
        onRefresh: fetchData,
        setSelection,
        handleRename,
        handleUpdateDescription,
        handleUploadFile,
        handleUploadFolder,
        handleCreateFolder
    });

    const { isProcessing, isFailed } = useFileIcon();

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
    const handleDoubleClick = (file) => {
        if (isProcessing(file) || isFailed(file)) return;
        handleDoubleClickBase(file);
    };

    const handleSmartClickWrapper = (e, file, index) => {
        if (isProcessing(file) || isFailed(file)) return;
        handleSmartClick(e, file, index);
    };

    const handleMenuAction = (action, file) => {
        fileActions.handleMenuAction(action, file, closeAllMenus);
    };

    const handleBackgroundAction = (action) => {
        fileActions.handleBackgroundMenuAction(action, closeContextMenu);
    };

    const handleBatchAction = (actionType) => {
        if (actionType === BATCH_ACTIONS.MOVE) {
            fileActions.openMoveModal(selectedFiles);
        } else if (actionType === BATCH_ACTIONS.DELETE) {
            fileActions.handleSoftDelete(selectedFiles);
        }
    };

    const handleBreadcrumbClick = (item) => {
        if (item.isRoot) {
            navigate(item.type === 'SHARED_ROOT' ? '/shared' : '/');
        } else {
            navigate(`/folders/${item.id}`);
        }
    };

    // 5. DATA FETCHING
    useEffect(() => {
        setCurrentFolder(folderId || null);
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [folderId, refreshKey, sortConfig]);

    async function fetchData() {
        setLoading(true);
        try {
            const currentId = folderId || null;
            const filesRes = await fileService.getFiles(currentId, sortConfig.sortBy, sortConfig.direction);
            if (filesRes.success) setFiles(filesRes.data);

            if (!currentId) {
                // ROOT
                const statsRes = await fileService.getDashboardStats();
                if (statsRes.success) setStats(statsRes.data);
                setBreadcrumbs([{ id: null, name: 'Tài liệu của tôi', isRoot: true, type: 'MY_ROOT' }]);
                updatePermissions({ canCreateFolder: true, canUploadFile: true, canUploadFolder: true });
            } else {
                // FOLDER CON
                const folderDetailRes = await fileService.getFileDetails(currentId);
                if (folderDetailRes.success) {
                    const perms = folderDetailRes.data.permissions;
                    updatePermissions({
                        canCreateFolder: perms.canCreateFolder,
                        canUploadFile: perms.canUploadFile,
                        canUploadFolder: perms.canUploadFolder
                    });
                }

                const breadRes = await fileService.getBreadcrumbs(currentId);
                if (breadRes.success && breadRes.data.length > 0) {
                    const topFolder = breadRes.data[0];
                    const currentUser = JSON.parse(localStorage.getItem('user'));
                    const rootCrumb = topFolder.ownerId === currentUser?.userId
                        ? { id: null, name: 'Tài liệu của tôi', isRoot: true, type: 'MY_ROOT' }
                        : { path: '/shared', name: 'Được chia sẻ', isRoot: true, type: 'SHARED_ROOT' };
                    setBreadcrumbs([rootCrumb, ...breadRes.data]);
                }
            }
        } catch (error) {
            console.error("Load data error:", error);
            toast.error("Không thể tải dữ liệu.");
        } finally {
            setLoading(false);
        }
    }

    // 6. WEBSOCKET
    useFileWebSocket(user?.userId, (msg) => {
        setFiles(prev => prev.map(f => f.id === msg.fileId ? { ...f, status: msg.status } : f));
    });

    // 7. RENDER
    return (
        <>
            <div className="animate-fade-in pb-10 min-h-[80vh]" onContextMenu={openContextMenu}>

                {/* STATS */}
                {!folderId && (
                    <DashboardStats
                        title="Tài liệu của tôi"
                        stats={[
                            { type: STAT_TYPES.STORAGE, value: stats.totalSize },
                            { type: STAT_TYPES.TOTAL_FILES, value: stats.totalFiles }
                        ]}
                    />
                )}

                {/* BREADCRUMB */}
                <Breadcrumb
                    items={breadcrumbs}
                    onItemClick={handleBreadcrumbClick}
                    onMenuClick={(e, item) => { e.stopPropagation(); openBreadcrumbMenu(e, item); }}
                    onContextMenu={openBreadcrumbMenuFromContext}
                />

                {/* TOOLBAR */}
                <FileToolbar
                    title={folderId ? breadcrumbs[breadcrumbs.length - 1]?.name : 'Thư mục gốc'}
                    sortValue={`${sortConfig.sortBy}-${sortConfig.direction}`}
                    onSortChange={({ sortBy, direction }) => setSortConfig({ sortBy, direction })}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    visibleColumns={visibleColumns}
                    columnOptions={DASHBOARD_COLUMNS}
                    onColumnsChange={setVisibleColumns}
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
                                onRetry={(e, file) => fileActions.handleRetry(e, file, setFiles)}
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
                            />
                        )
                    ) : (
                        <EmptyState type="folder" />
                    )
                )}

            </div>
            {/* CONTEXT MENUS */}
            <BackgroundContextMenu menuState={contextMenu} onClose={closeContextMenu} onAction={handleBackgroundAction} permissions={currentPermissions} />
            <ItemContextMenu menuState={itemMenu} onClose={closeItemMenu} onAction={handleMenuAction} />
            <ItemContextMenu menuState={breadcrumbMenu} onClose={closeBreadcrumbMenu} onAction={handleMenuAction} />

            {/* MODALS */}
            <CreateFolderModal isOpen={fileActions.showCreateModal} onClose={fileActions.closeCreateFolderModal} onSubmit={(name) => { fileActions.setNewFolderName(name); fileActions.submitCreateFolder({ preventDefault: () => { } }); }} value={fileActions.newFolderName} onChange={fileActions.setNewFolderName} />
            <RenameModal isOpen={fileActions.showRenameModal} onClose={fileActions.closeRenameModal} onSubmit={() => fileActions.submitRename({ preventDefault: () => { } })} item={fileActions.renameData.item} value={fileActions.renameData.newName} onChange={(val) => fileActions.setRenameData({ ...fileActions.renameData, newName: val })} />
            <DescriptionModal isOpen={fileActions.showDescModal} onClose={fileActions.closeDescModal} onSubmit={() => fileActions.submitDescription({ preventDefault: () => { } })} item={fileActions.descData.item} value={fileActions.descData.description} onChange={(val) => fileActions.setDescData({ ...fileActions.descData, description: val })} />
            <FileInfoModal isOpen={fileActions.showInfoModal} onClose={fileActions.closeInfoModal} data={fileActions.infoData} loading={fileActions.infoLoading} currentUserId={currentUserId} />
            <ShareModal isOpen={fileActions.showShareModal} onClose={fileActions.closeShareModal} data={fileActions.shareData} loading={fileActions.shareLoading} currentUserId={currentUserId} emailInput={fileActions.emailInput} onEmailChange={fileActions.setEmailInput} permissionInput={fileActions.permissionInput} onPermissionChange={fileActions.setPermissionInput} onAddUser={fileActions.handleAddUserShare} onRevokeClick={fileActions.clickRevoke} onUpdatePermission={fileActions.handleUpdatePermission} onChangePublicAccess={fileActions.handleChangePublicAccess} onCopyLink={fileActions.copyShareLink} />
            <ConfirmRevokeModal isOpen={fileActions.showConfirmRevokeModal} onClose={fileActions.closeConfirmRevokeModal} onConfirm={fileActions.confirmRevoke} user={fileActions.userToRevoke} loading={fileActions.revokeLoading} />
            <MoveFileModal isOpen={fileActions.showMoveModal} onClose={fileActions.closeMoveModal} selectedItems={selectedFiles} onSuccess={fileActions.handleMoveSuccess} />
            <DeleteConfirmModal isOpen={fileActions.showDeleteModal} onClose={fileActions.closeDeleteModal} onConfirm={fileActions.executeDelete} count={fileActions.filesToDelete.length} isLoading={fileActions.deleting} isPermanent={false} />

            {/* HIDDEN INPUTS */}
            <input type="file" className="hidden" ref={fileActions.folderInputRef} onChange={fileActions.onFolderSelect} webkitdirectory="" directory="" multiple />
            <input type="file" multiple className="hidden" ref={fileActions.fileInputRef} onChange={fileActions.onFileSelect} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />

        </>
    );
};

export default DashboardPage;