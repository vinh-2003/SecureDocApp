import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
    View,
    FlatList,
    RefreshControl,
    StyleSheet,
    ActivityIndicator,
    BackHandler,
    Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { FontAwesome5 } from '@expo/vector-icons';

// --- CONTEXT & SERVICES ---
import { AuthContext } from '../../context/AuthContext';
import fileService from '../../services/fileService';

// --- HOOKS ---
import useFileActions from '../../hooks/useFileActions';

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
import EmptyState from '../../components/FileExplorer/EmptyState';
import BatchActionBar, { BATCH_ACTIONS } from '../../components/FileExplorer/BatchActionBar';
import ViewModeToggle from '../../components/Common/ViewModeToggle';
import Breadcrumb, { BREADCRUMB_ROOTS } from '../../components/Common/Breadcrumb';

// Modals
import RenameModal from '../../components/Dashboard/RenameModal';
import DescriptionModal from '../../components/Dashboard/DescriptionModal';
import DeleteConfirmModal from '../../components/Dashboard/DeleteConfirmModal';
import FileInfoModal from '../../components/Dashboard/FileInfoModal';
import MoveFileModal from '../../components/Dashboard/MoveFileModal';
import ShareModal from '../../components/Dashboard/ShareModal';
import ConfirmRevokeModal from '../../components/Dashboard/ConfirmRevokeModal';

const SharedScreen = ({ navigation, route }) => {
    // =========================================================================
    // 1. PARAMS & CONTEXT
    // =========================================================================
    const currentFolderId = route.params?.folderId || null;
    const folderName = route.params?.folderName || null;
    const isSubfolder = !!currentFolderId;

    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId;

    const { showActionSheetWithOptions } = useActionSheet();

    // =========================================================================
    // 2. LOCAL STATE
    // =========================================================================
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Pagination (chỉ dùng cho root shared)
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    // Breadcrumb State
    const [breadcrumbs, setBreadcrumbs] = useState([]);

    // UI State
    const [viewMode, setViewMode] = useState('list');

    // Selection State
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const isSelectionMode = selectedIds.size > 0;

    // =========================================================================
    // 3. FETCH DATA
    // =========================================================================
    const fetchData = useCallback(async (pageNum = 0, isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else if (pageNum === 0) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            let filesData = [];

            if (isSubfolder) {
                const res = await fileService.getFiles(currentFolderId);
                filesData = res.data || [];

                try {
                    const breadcrumbRes = await fileService.getBreadcrumbs(currentFolderId);
                    if (breadcrumbRes.data) {
                        setBreadcrumbs(breadcrumbRes.data);
                    }
                } catch (err) {
                    console.log('Could not fetch breadcrumbs:', err);
                    setBreadcrumbs([{ id: currentFolderId, name: folderName }]);
                }
            } else {
                const res = await fileService.getSharedFiles(pageNum, PAGE_SIZE);

                if (res.success || res.data) {
                    const newFiles = res.data?.content || res.data || [];
                    const totalPages = res.data?.totalPages || 1;

                    if (pageNum === 0 || isRefresh) {
                        filesData = newFiles;
                    } else {
                        filesData = [...files, ...newFiles];
                    }

                    setHasMore(pageNum < totalPages - 1);
                    setPage(pageNum);
                }

                setBreadcrumbs([]);
            }

            setFiles(filesData);
        } catch (error) {
            console.error('Fetch data error:', error);
            Toast.show({ type: 'error', text1: 'Lỗi tải dữ liệu' });
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [currentFolderId, folderName, isSubfolder, files]);

    useEffect(() => {
        fetchData(0);
    }, [currentFolderId]);

    useFocusEffect(
        useCallback(() => {
            if (!isSubfolder) {
                fetchData(0);
            }
        }, [isSubfolder])
    );

    // =========================================================================
    // 4. LOAD MORE (Infinite Scroll)
    // =========================================================================
    const handleLoadMore = useCallback(() => {
        if (!isSubfolder && !loadingMore && hasMore && !loading) {
            fetchData(page + 1);
        }
    }, [isSubfolder, loadingMore, hasMore, loading, page, fetchData]);

    // =========================================================================
    // 5. HANDLE BACK BUTTON (Android)
    // =========================================================================
    useEffect(() => {
        const backAction = () => {
            if (isSelectionMode) {
                setSelectedIds(new Set());
                return true;
            }
            if (isSubfolder && navigation.canGoBack()) {
                navigation.goBack();
                return true;
            }
            return false;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [isSelectionMode, isSubfolder, navigation]);

    // =========================================================================
    // 6. USE FILE ACTIONS HOOK
    // =========================================================================
    const handleRename = useCallback(async (item, newName) => {
        try {
            const isFolder = item.type === 'FOLDER';
            const res = isFolder
                ? await fileService.renameFolder(item.id, newName)
                : await fileService.renameFile(item.id, newName);

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Đã đổi tên thành công' });
                setFiles(prev => prev.map(f =>
                    f.id === item.id ? { ...f, name: newName } : f
                ));
                return true;
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi đổi tên',
                text2: error.response?.data?.message || 'Vui lòng thử lại'
            });
        }
        return false;
    }, []);

    const handleUpdateDescription = useCallback(async (item, description) => {
        try {
            const isFolder = item.type === 'FOLDER';
            const res = isFolder
                ? await fileService.updateFolderDescription(item.id, description)
                : await fileService.updateFileDescription(item.id, description);

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Đã cập nhật mô tả' });
                setFiles(prev => prev.map(f =>
                    f.id === item.id ? { ...f, description } : f
                ));
                return true;
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi cập nhật mô tả',
                text2: error.response?.data?.message || 'Vui lòng thử lại'
            });
        }
        return false;
    }, []);

    const fileActions = useFileActions({
        onRefresh: () => fetchData(0, true),
        setSelection: setSelectedIds,
        handleRename,
        handleUpdateDescription
    });

    // =========================================================================
    // 7. SELECTION HANDLERS
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
    // 8. BREADCRUMB HANDLERS
    // =========================================================================
    const handleBreadcrumbPress = useCallback((item) => {
        navigation.push('SharedFolder', {
            folderId: item.id,
            folderName: item.name
        });
    }, [navigation]);

    const handleRootPress = useCallback(() => {
        navigation.navigate('Main', { screen: 'SharedTab' });
    }, [navigation]);

    // =========================================================================
    // 9. ITEM INTERACTION HANDLERS
    // =========================================================================
    const handleItemPress = useCallback((item) => {
        if (selectedIds.size > 0) {
            toggleSelection(item);
        } else if (item.type === 'FOLDER') {
            navigation.push('SharedFolder', {
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
    // 10. CONTEXT MENU (3 chấm)
    // =========================================================================
    const handleMenuPress = useCallback((item) => {
        if (selectedIds.size > 0) return;

        const menuOptions = getMenuOptions(item, {
            currentUserId,
            isSharedContext: true
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
    // 11. BATCH ACTIONS - Sử dụng onAction callback
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
                // Không dùng ở SharedScreen
                break;
            case BATCH_ACTIONS.DELETE_PERMANENT:
                // Không dùng ở SharedScreen
                break;
        }
    }, [getSelectedItems, fileActions]);

    // =========================================================================
    // 12. RENDER ITEM
    // =========================================================================
    const renderItem = useCallback(({ item }) => {
        const isSelected = selectedIds instanceof Set ? selectedIds.has(item.id) : false;

        const itemWithOwner = {
            ...item,
            ownerName: item.ownerName || item.owner?.name || item.owner?.fullName,
            ownerEmail: item.ownerEmail || item.owner?.email,
            ownerAvatar: item.ownerAvatar || item.owner?.avatarUrl
        };

        if (viewMode === 'grid') {
            return (
                <FileGridItem
                    item={itemWithOwner}
                    onPress={() => handleItemPress(item)}
                    onLongPress={() => handleItemLongPress(item)}
                    onMenuPress={() => handleMenuPress(item)}
                    isSelected={isSelected}
                    showOwner={!isSubfolder}
                />
            );
        }

        return (
            <FileItem
                item={itemWithOwner}
                onPress={() => handleItemPress(item)}
                onLongPress={() => handleItemLongPress(item)}
                isSelected={isSelected}
                onMenuPress={() => handleMenuPress(item)}
                showOwner={!isSubfolder}
            />
        );
    }, [selectedIds, viewMode, isSubfolder, handleItemPress, handleItemLongPress, handleMenuPress]);

    // =========================================================================
    // 13. RENDER FOOTER (Loading More)
    // =========================================================================
    const renderFooter = useCallback(() => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
            </View>
        );
    }, [loadingMore]);

    // =========================================================================
    // 14. RENDER
    // =========================================================================
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Header />

            {/* Breadcrumb - Hiển thị khi đang trong subfolder */}
            {isSubfolder && breadcrumbs.length > 0 && (
                <Breadcrumb
                    items={breadcrumbs}
                    onItemPress={handleBreadcrumbPress}
                    onRootPress={handleRootPress}
                    rootType={BREADCRUMB_ROOTS.SHARED_ROOT}
                />
            )}

            {/* Page Header - Chỉ hiển thị ở root */}
            {!isSubfolder && (
                <View style={styles.pageHeader}>
                    <View style={styles.pageHeaderLeft}>
                        <View style={styles.pageHeaderIcon}>
                            <FontAwesome5 name="share-alt" size={18} color="#7C3AED" />
                        </View>
                        <View>
                            <Text style={styles.pageTitle}>
                                {isSelectionMode ? `${selectedIds.size} đã chọn` : 'Được chia sẻ'}
                            </Text>
                            <Text style={styles.pageSubtitle}>
                                Các tệp được chia sẻ với bạn
                            </Text>
                        </View>
                    </View>

                    {!isSelectionMode && (
                        <ViewModeToggle
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                        />
                    )}
                </View>
            )}

            {/* Toolbar cho subfolder */}
            {isSubfolder && (
                <View style={styles.subfolderToolbar}>
                    <Text style={styles.subfolderTitle}>
                        {isSelectionMode ? `${selectedIds.size} đã chọn` : ''}
                    </Text>
                    <ViewModeToggle
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />
                </View>
            )}

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#7C3AED" />
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
                            onRefresh={() => fetchData(0, true)}
                            colors={['#7C3AED']}
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            type="shared"
                            icon="share-alt"
                            title={isSubfolder ? 'Thư mục trống' : 'Chưa có tệp được chia sẻ'}
                            subtitle={isSubfolder
                                ? 'Thư mục này chưa có nội dung'
                                : 'Các tệp được người khác chia sẻ với bạn sẽ xuất hiện ở đây'
                            }
                        />
                    }
                    ListFooterComponent={!isSubfolder ? renderFooter : null}
                    onEndReached={!isSubfolder ? handleLoadMore : undefined}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={{
                        paddingBottom: 100,
                        paddingHorizontal: viewMode === 'grid' ? 4 : 0,
                        flexGrow: files.length === 0 ? 1 : undefined
                    }}
                    extraData={selectedIds}
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
                selectedItems={fileActions.filesToDelete || []}
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
    },
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    pageHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12
    },
    pageHeaderIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    pageTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    pageSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },
    subfolderToolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    subfolderTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937'
    },
    loadingMore: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8
    },
    loadingMoreText: {
        fontSize: 13,
        color: '#6B7280'
    }
});

export default SharedScreen;