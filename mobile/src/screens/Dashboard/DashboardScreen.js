import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import {
    View,
    FlatList,
    RefreshControl,
    StyleSheet,
    ActivityIndicator,
    BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

// --- CONTEXT & SERVICES ---
import { FileContext } from '../../context/FileContext';
import { AuthContext } from '../../context/AuthContext';
import fileService from '../../services/fileService';

// --- HOOKS ---
import useFileActions from '../../hooks/useFileActions';
import useFileWebSocket from '../../hooks/useFileWebSocket';

// --- UTILS ---
import {
    getMenuOptions,
    toActionSheetFormat,
    handleActionSheetSelection
} from '../../utils/menuHelper';

// --- COMPONENTS ---
import Header from '../../components/Header/Header';
import FileItem from '../../components/FileExplorer/FileItem';
import FileGridItem from '../../components/FileExplorer/FileGridItem';
import FileToolbar from '../../components/FileExplorer/FileToolbar';
import EmptyState from '../../components/FileExplorer/EmptyState';
import BatchActionBar, { BATCH_ACTIONS } from '../../components/FileExplorer/BatchActionBar';
import DashboardStats from '../../components/Dashboard/DashboardStats';
import FAB from '../../components/Common/FAB';
import Breadcrumb, { BREADCRUMB_ROOTS } from '../../components/Common/Breadcrumb';

// Modals
import CreateFolderModal from '../../components/Dashboard/CreateFolderModal';
import RenameModal from '../../components/Dashboard/RenameModal';
import DescriptionModal from '../../components/Dashboard/DescriptionModal';
import DeleteConfirmModal from '../../components/Dashboard/DeleteConfirmModal';
import FileInfoModal from '../../components/Dashboard/FileInfoModal';
import MoveFileModal from '../../components/Dashboard/MoveFileModal';
import ShareModal from '../../components/Dashboard/ShareModal';
import ConfirmRevokeModal from '../../components/Dashboard/ConfirmRevokeModal';

const DashboardScreen = ({ navigation, route }) => {
    // =========================================================================
    // 1. PARAMS & CONTEXT
    // =========================================================================
    const currentFolderId = route.params?.folderId || null;
    const folderName = route.params?.folderName || 'Tài liệu của tôi';

    const {
        setCurrentFolder,
        handleCreateFolder,
        handleRename,
        handleUpdateDescription,
        handleUploadFile,
        refreshKey,
        updatePermissions
    } = useContext(FileContext);

    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId;

    const { showActionSheetWithOptions } = useActionSheet();

    // =========================================================================
    // 2. LOCAL STATE
    // =========================================================================
    const [files, setFiles] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Breadcrumb State
    const [breadcrumbs, setBreadcrumbs] = useState([]);

    // UI State
    const [viewMode, setViewMode] = useState('list');
    const [sortConfig, setSortConfig] = useState({ sortBy: 'createdAt', direction: 'desc' });
    const [showCreateFolder, setShowCreateFolder] = useState(false);

    // Selection State
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const isSelectionMode = selectedIds.size > 0;

    // =========================================================================
    // 3. REFS
    // =========================================================================
    const updatePermissionsRef = useRef(updatePermissions);
    const setCurrentFolderRef = useRef(setCurrentFolder);

    useEffect(() => {
        updatePermissionsRef.current = updatePermissions;
        setCurrentFolderRef.current = setCurrentFolder;
    });

    // =========================================================================
    // 4. SET CURRENT FOLDER
    // =========================================================================
    useEffect(() => {
        setCurrentFolderRef.current(currentFolderId);
    }, [currentFolderId]);

    useFocusEffect(
        useCallback(() => {
            setCurrentFolderRef.current(currentFolderId);
        }, [currentFolderId])
    );

    // =========================================================================
    // 5. FETCH DATA
    // =========================================================================
    const fetchData = useCallback(async () => {
        try {
            const [filesRes, statsRes] = await Promise.all([
                fileService.getFiles(currentFolderId, sortConfig.sortBy, sortConfig.direction),
                !currentFolderId ? fileService.getDashboardStats() : Promise.resolve({ data: null })
            ]);

            setFiles(filesRes.data || []);
            if (statsRes.data) setStats(statsRes.data);

            // Fetch breadcrumbs nếu đang trong subfolder
            if (currentFolderId) {
                try {
                    const breadcrumbRes = await fileService.getBreadcrumbs(currentFolderId);
                    if (breadcrumbRes.data) {
                        setBreadcrumbs(breadcrumbRes.data);
                    }
                } catch (err) {
                    console.log('Could not fetch breadcrumbs:', err);
                    setBreadcrumbs([{ id: currentFolderId, name: folderName }]);
                }

                try {
                    const folderDetailRes = await fileService.getFileDetails(currentFolderId);
                    if (folderDetailRes.data?.permissions) {
                        updatePermissionsRef.current({
                            canCreateFolder: folderDetailRes.data.permissions.canCreateFolder,
                            canUploadFile: folderDetailRes.data.permissions.canUploadFile,
                            canUploadFolder: false
                        });
                    }
                } catch (err) {
                    console.log('Could not fetch folder permissions:', err);
                }
            } else {
                setBreadcrumbs([]);
                updatePermissionsRef.current({
                    canCreateFolder: true,
                    canUploadFile: true,
                    canUploadFolder: false
                });
            }
        } catch (error) {
            console.error('Fetch data error:', error);
            Toast.show({ type: 'error', text1: 'Lỗi tải dữ liệu' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentFolderId, folderName, sortConfig.sortBy, sortConfig.direction]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData, refreshKey]);

    // =========================================================================
    // 6. WEBSOCKET
    // =========================================================================
    const handleWebSocketUpdate = useCallback((msg) => {
        setFiles(prev => prev.map(f =>
            f.id === msg.fileId
                ? { ...f, status: msg.status }
                : f
        ));
    }, []);

    useFileWebSocket(currentUserId, handleWebSocketUpdate, {
        showToast: true,
        onConnect: () => console.log('📡 WebSocket connected'),
        onDisconnect: () => console.log('📡 WebSocket disconnected')
    });

    // =========================================================================
    // 7. HANDLE BACK BUTTON (Android)
    // =========================================================================
    useEffect(() => {
        const backAction = () => {
            if (isSelectionMode) {
                setSelectedIds(new Set());
                return true;
            }
            if (currentFolderId && navigation.canGoBack()) {
                navigation.goBack();
                return true;
            }
            return false;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [isSelectionMode, currentFolderId, navigation]);

    // =========================================================================
    // 8. USE FILE ACTIONS HOOK
    // =========================================================================
    const fileActions = useFileActions({
        onRefresh: fetchData,
        setSelection: setSelectedIds,
        handleRename,
        handleUpdateDescription,
        handleUploadFile,
        handleCreateFolder
    });

    // =========================================================================
    // 9. SELECTION HANDLERS
    // =========================================================================
    const toggleSelection = useCallback((item) => {
        setSelectedIds(prev => {
            const newIds = new Set(prev);
            if (newIds.has(item.id)) {
                newIds.delete(item.id);
            } else {
                newIds.add(item.id);
            }
            return newIds;
        });
    }, []);

    const handleClearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const getSelectedItems = useCallback(() => {
        return files.filter(f => selectedIds.has(f.id));
    }, [files, selectedIds]);

    // =========================================================================
    // 10. BREADCRUMB HANDLERS
    // =========================================================================
    const handleBreadcrumbPress = useCallback((item) => {
        if (item.id === null) {
            navigation.navigate('Main', { screen: 'HomeTab' });
        } else {
            navigation.navigate('Main', { screen: 'HomeTab' });
            setTimeout(() => {
                navigation.push('FolderDetail', {
                    folderId: item.id,
                    folderName: item.name
                });
            }, 100);
        }
    }, [navigation]);

    const handleHomePress = useCallback(() => {
        navigation.navigate('Main', { screen: 'HomeTab' });
    }, [navigation]);

    // =========================================================================
    // 11. ITEM INTERACTION HANDLERS
    // =========================================================================
    const handleItemPress = useCallback((item) => {
        if (selectedIds.size > 0) {
            toggleSelection(item);
        } else if (item.type === 'FOLDER') {
            navigation.push('FolderDetail', {
                folderId: item.id,
                folderName: item.name
            });
        } else {
            navigation.navigate('FileViewer', { fileId: item.id, file: item });
        }
    }, [selectedIds.size, toggleSelection, navigation]);

    const handleItemLongPress = useCallback((item) => {
        toggleSelection(item);
    }, [toggleSelection]);

    // =========================================================================
    // 12. CONTEXT MENU (3 chấm)
    // =========================================================================
    const handleMenuPress = useCallback((item) => {
        if (selectedIds.size > 0) return;

        const menuOptions = getMenuOptions(item, {
            currentUserId,
            isSharedContext: false,
            isTrashContext: false
        });

        if (menuOptions.length === 0) return;

        const { options, cancelButtonIndex, destructiveButtonIndex } = toActionSheetFormat(menuOptions);

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                destructiveButtonIndex,
                title: item.name
            },
            (selectedIndex) => {
                handleActionSheetSelection(selectedIndex, menuOptions, fileActions, item);
            }
        );
    }, [selectedIds.size, currentUserId, showActionSheetWithOptions, fileActions]);

    // =========================================================================
    // 13. BATCH ACTIONS - Sử dụng onAction callback
    // =========================================================================
    const handleBatchAction = useCallback((actionType) => {
        const selectedItems = getSelectedItems();
        
        switch (actionType) {
            case BATCH_ACTIONS.MOVE:
                fileActions.openMoveModal(selectedItems);
                break;
            case BATCH_ACTIONS.DELETE:
                fileActions.openDeleteModal(selectedItems);
                break;
            case BATCH_ACTIONS.RESTORE:
                // Không dùng ở Dashboard
                break;
            case BATCH_ACTIONS.DELETE_PERMANENT:
                // Không dùng ở Dashboard
                break;
        }
    }, [getSelectedItems, fileActions]);

    // =========================================================================
    // 14. RENDER ITEM
    // =========================================================================
    const renderItem = useCallback(({ item }) => {
        const isSelected = selectedIds instanceof Set ? selectedIds.has(item.id) : false;

        if (viewMode === 'grid') {
            return (
                <FileGridItem
                    item={item}
                    onPress={() => handleItemPress(item)}
                    onLongPress={() => handleItemLongPress(item)}
                    onMenuPress={() => handleMenuPress(item)}
                    isSelected={isSelected}
                />
            );
        }

        return (
            <FileItem
                item={item}
                onPress={() => handleItemPress(item)}
                onLongPress={() => handleItemLongPress(item)}
                isSelected={isSelected}
                onMenuPress={() => handleMenuPress(item)}
            />
        );
    }, [selectedIds, viewMode, handleItemPress, handleItemLongPress, handleMenuPress]);

    // =========================================================================
    // 15. RENDER
    // =========================================================================
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Header />

            {/* Breadcrumb - Chỉ hiển thị khi đang trong subfolder */}
            {currentFolderId && breadcrumbs.length > 0 && (
                <Breadcrumb
                    items={breadcrumbs}
                    onItemPress={handleBreadcrumbPress}
                    onRootPress={handleHomePress}
                    rootType={BREADCRUMB_ROOTS.MY_ROOT}
                />
            )}

            <FileToolbar
                title={isSelectionMode ? `${selectedIds.size} đã chọn` : (currentFolderId ? '' : folderName)}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sortValue={`${sortConfig.sortBy}-${sortConfig.direction}`}
                onSortChange={setSortConfig}
                showTitle={!currentFolderId || isSelectionMode}
            />

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    key={viewMode}
                    data={files}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchData();
                            }}
                            colors={['#2563EB']}
                        />
                    }
                    ListHeaderComponent={
                        (!currentFolderId && !isSelectionMode) ? (
                            <DashboardStats stats={stats} />
                        ) : null
                    }
                    ListEmptyComponent={
                        <EmptyState
                            type="folder"
                            title="Thư mục trống"
                            subtitle="Nhấn vào nút (+) để tải lên hoặc tạo mới"
                        />
                    }
                    contentContainerStyle={{
                        paddingBottom: 100,
                        paddingHorizontal: viewMode === 'grid' ? 4 : 0,
                        flexGrow: files.length === 0 ? 1 : undefined
                    }}
                    extraData={selectedIds}
                />
            )}

            {!isSelectionMode && (
                <FAB
                    onUpload={fileActions.triggerFileUpload}
                    onCreateFolder={() => setShowCreateFolder(true)}
                />
            )}

            {/* BatchActionBar - Truyền selectedFiles để kiểm tra permissions */}
            <BatchActionBar
                selectedCount={selectedIds.size}
                selectedFiles={getSelectedItems()}
                onClearSelection={handleClearSelection}
                onAction={handleBatchAction}
                variant="default"
            />

            {/* ================================================================= */}
            {/* MODALS */}
            {/* ================================================================= */}

            <CreateFolderModal
                isOpen={showCreateFolder}
                onClose={() => setShowCreateFolder(false)}
                onSubmit={async (name) => {
                    const success = await handleCreateFolder(name);
                    if (success) {
                        setShowCreateFolder(false);
                        fetchData();
                    }
                }}
            />

            <RenameModal
                isOpen={fileActions.showRenameModal}
                onClose={fileActions.closeRenameModal}
                onSubmit={fileActions.submitRename}
                currentName={fileActions.renameData?.item?.name}
                value={fileActions.renameData?.newName}
                onChange={(val) => fileActions.setRenameData({
                    ...fileActions.renameData,
                    newName: val
                })}
            />

            <DescriptionModal
                isOpen={fileActions.showDescModal}
                onClose={fileActions.closeDescModal}
                onSubmit={fileActions.submitDescription}
                item={fileActions.descData?.item}
                value={fileActions.descData?.description}
                onChange={(val) => fileActions.setDescData({
                    ...fileActions.descData,
                    description: val
                })}
            />

            <DeleteConfirmModal
                isOpen={fileActions.showDeleteModal}
                onClose={fileActions.closeDeleteModal}
                onConfirm={fileActions.executeDelete}
                count={fileActions.filesToDelete?.length || 0}
                loading={fileActions.deleting}
            />

            <FileInfoModal
                isOpen={fileActions.showInfoModal}
                onClose={fileActions.closeInfoModal}
                data={fileActions.infoData}
                loading={fileActions.infoLoading}
                currentUserId={currentUserId}
            />

            <MoveFileModal
                isOpen={fileActions.showMoveModal}
                onClose={fileActions.closeMoveModal}
                selectedItems={fileActions.filesToMove || []}
                onSuccess={fileActions.handleMoveSuccess}
            />

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

            <ConfirmRevokeModal
                isOpen={fileActions.showConfirmRevokeModal}
                onClose={fileActions.closeConfirmRevokeModal}
                onConfirm={fileActions.confirmRevoke}
                user={fileActions.userToRevoke}
                loading={fileActions.revokeLoading}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default DashboardScreen;