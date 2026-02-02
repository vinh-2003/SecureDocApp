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
import { formatRelativeTime } from '../../utils/format';

// --- COMPONENTS ---
import Header from '../../components/Header/Header';
import FileItem from '../../components/FileExplorer/FileItem';
import FileGridItem from '../../components/FileExplorer/FileGridItem';
import EmptyState from '../../components/FileExplorer/EmptyState';
import BatchActionBar, { BATCH_ACTIONS } from '../../components/FileExplorer/BatchActionBar';
import ViewModeToggle from '../../components/Common/ViewModeToggle';

// Modals
import RenameModal from '../../components/Dashboard/RenameModal';
import DescriptionModal from '../../components/Dashboard/DescriptionModal';
import DeleteConfirmModal from '../../components/Dashboard/DeleteConfirmModal';
import FileInfoModal from '../../components/Dashboard/FileInfoModal';
import MoveFileModal from '../../components/Dashboard/MoveFileModal';
import ShareModal from '../../components/Dashboard/ShareModal';
import ConfirmRevokeModal from '../../components/Dashboard/ConfirmRevokeModal';

const RecentScreen = ({ navigation }) => {
    // =========================================================================
    // 1. CONTEXT
    // =========================================================================
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

    // Pagination
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 12;

    // UI State
    const [viewMode, setViewMode] = useState('list');

    // Selection State
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const isSelectionMode = selectedIds.size > 0;

    // =========================================================================
    // 3. FETCH DATA
    // =========================================================================
    const fetchRecentFiles = useCallback(async (pageNum = 0, isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else if (pageNum === 0) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const res = await fileService.getRecentFiles(pageNum, PAGE_SIZE);

            if (res.success || res.data) {
                const rawData = res.data?.content || res.data || [];

                const transformedItems = rawData.map(item => {
                    if (item.file) {
                        return {
                            ...item.file,
                            accessedAt: item.accessedAt
                        };
                    }
                    return {
                        ...item,
                        accessedAt: item.accessedAt || item.lastAccessedAt
                    };
                });

                if (pageNum === 0 || isRefresh) {
                    setFiles(transformedItems);
                } else {
                    setFiles(prev => {
                        const uniqueMap = new Map();
                        [...prev, ...transformedItems].forEach(f => uniqueMap.set(f.id, f));
                        return Array.from(uniqueMap.values());
                    });
                }

                setHasMore(transformedItems.length >= PAGE_SIZE);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Fetch recent files error:', error);
            Toast.show({ type: 'error', text1: 'Lỗi tải dữ liệu' });
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchRecentFiles(0);
    }, [fetchRecentFiles]);

    useFocusEffect(
        useCallback(() => {
            fetchRecentFiles(0);
        }, [fetchRecentFiles])
    );

    // =========================================================================
    // 4. LOAD MORE (Infinite Scroll)
    // =========================================================================
    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            fetchRecentFiles(page + 1);
        }
    }, [loadingMore, hasMore, loading, page, fetchRecentFiles]);

    // =========================================================================
    // 5. HANDLE BACK BUTTON (Android)
    // =========================================================================
    useEffect(() => {
        const backAction = () => {
            if (isSelectionMode) {
                setSelectedIds(new Set());
                return true;
            }
            return false;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [isSelectionMode]);

    // =========================================================================
    // 6. USE FILE ACTIONS HOOK
    // =========================================================================
    const handleRename = useCallback(async (item, newName) => {
        try {
            const res = await fileService.renameFile(item.id, newName);

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
            const res = await fileService.updateFileDescription(item.id, description);

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
        onRefresh: () => fetchRecentFiles(0, true),
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
    // 8. ITEM INTERACTION HANDLERS
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
    // 9. CONTEXT MENU (3 chấm)
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
    // 10. BATCH ACTIONS - Sử dụng onAction callback
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
                // Không dùng ở RecentScreen
                break;
            case BATCH_ACTIONS.DELETE_PERMANENT:
                // Không dùng ở RecentScreen
                break;
        }
    }, [getSelectedItems, fileActions]);

    // =========================================================================
    // 11. RENDER ITEM
    // =========================================================================
    const renderItem = useCallback(({ item }) => {
        const isSelected = selectedIds instanceof Set ? selectedIds.has(item.id) : false;

        const itemWithAccessTime = {
            ...item,
            displayTime: item.accessedAt,
            accessedAtFormatted: formatRelativeTime(item.accessedAt)
        };

        if (viewMode === 'grid') {
            return (
                <FileGridItem
                    item={itemWithAccessTime}
                    onPress={() => handleItemPress(item)}
                    onLongPress={() => handleItemLongPress(item)}
                    onMenuPress={() => handleMenuPress(item)}
                    isSelected={isSelected}
                    showAccessedAt={true}
                />
            );
        }

        return (
            <FileItem
                item={itemWithAccessTime}
                onPress={() => handleItemPress(item)}
                onLongPress={() => handleItemLongPress(item)}
                isSelected={isSelected}
                onMenuPress={() => handleMenuPress(item)}
                showAccessedAt={true}
            />
        );
    }, [selectedIds, viewMode, handleItemPress, handleItemLongPress, handleMenuPress]);

    // =========================================================================
    // 12. RENDER FOOTER (Loading More)
    // =========================================================================
    const renderFooter = useCallback(() => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#059669" />
                <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
            </View>
        );
    }, [loadingMore]);

    // =========================================================================
    // 13. RENDER
    // =========================================================================
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Header />

            {/* Page Header */}
            <View style={styles.pageHeader}>
                <View style={styles.pageHeaderLeft}>
                    <View style={styles.pageHeaderIcon}>
                        <FontAwesome5 name="clock" size={18} color="#059669" />
                    </View>
                    <View>
                        <Text style={styles.pageTitle}>
                            {isSelectionMode ? `${selectedIds.size} đã chọn` : 'Mở gần đây'}
                        </Text>
                        <Text style={styles.pageSubtitle}>
                            Các tài liệu bạn đã xem gần đây
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

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#059669" />
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
                            onRefresh={() => fetchRecentFiles(0, true)}
                            colors={['#059669']}
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            type="recent"
                            icon="clock"
                            title="Chưa có hoạt động gần đây"
                            subtitle="Các tệp bạn mở sẽ xuất hiện ở đây để truy cập nhanh"
                        />
                    }
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
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
        backgroundColor: '#D1FAE5',
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

export default RecentScreen;