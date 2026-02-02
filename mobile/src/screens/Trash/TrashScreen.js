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

// --- COMPONENTS ---
import Header from '../../components/Header/Header';
import FileItem from '../../components/FileExplorer/FileItem';
import FileGridItem from '../../components/FileExplorer/FileGridItem';
import EmptyState from '../../components/FileExplorer/EmptyState';
import BatchActionBar, { BATCH_ACTIONS } from '../../components/FileExplorer/BatchActionBar';
import ViewModeToggle from '../../components/Common/ViewModeToggle';
import Breadcrumb, { BREADCRUMB_ROOTS } from '../../components/Common/Breadcrumb';

// Modals
import DeletePermanentModal from '../../components/Dashboard/DeletePermanentModal';

const TrashScreen = ({ navigation, route }) => {
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

    // Breadcrumb State
    const [breadcrumbs, setBreadcrumbs] = useState([]);

    // UI State
    const [viewMode, setViewMode] = useState('list');

    // Selection State
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const isSelectionMode = selectedIds.size > 0;

    // Modal States
    const [showDeletePermanentModal, setShowDeletePermanentModal] = useState(false);
    const [filesToDelete, setFilesToDelete] = useState([]);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // =========================================================================
    // 3. FETCH DATA
    // =========================================================================
    const fetchTrashFiles = useCallback(async () => {
        try {
            setLoading(true);

            const res = await fileService.getTrashFiles(currentFolderId);
            const filesData = res.data || [];
            setFiles(filesData);

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
            } else {
                setBreadcrumbs([]);
            }
        } catch (error) {
            console.error('Fetch trash files error:', error);
            Toast.show({ type: 'error', text1: 'Lỗi tải dữ liệu' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentFolderId, folderName]);

    useEffect(() => {
        fetchTrashFiles();
    }, [fetchTrashFiles]);

    useFocusEffect(
        useCallback(() => {
            fetchTrashFiles();
        }, [fetchTrashFiles])
    );

    // =========================================================================
    // 4. HANDLE BACK BUTTON (Android)
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
    // 5. SELECTION HANDLERS
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
    // 6. BREADCRUMB HANDLERS
    // =========================================================================
    const handleBreadcrumbPress = useCallback((item) => {
        navigation.push('TrashFolder', {
            folderId: item.id,
            folderName: item.name
        });
    }, [navigation]);

    const handleRootPress = useCallback(() => {
        navigation.navigate('TrashScreen');
    }, [navigation]);

    // =========================================================================
    // 7. ITEM INTERACTION HANDLERS
    // =========================================================================
    const handleItemPress = useCallback((item) => {
        if (selectedIds.size > 0) {
            toggleSelection(item);
        } else if (item.type === 'FOLDER') {
            // Mở folder trong thùng rác
            navigation.push('TrashFolder', {
                folderId: item.id,
                folderName: item.name
            });
        } else {
            // Trong thùng rác, nhấn vào file sẽ mở modal xóa vĩnh viễn
            openDeletePermanentModal([item]);
        }
    }, [selectedIds.size, toggleSelection, navigation]);

    const handleItemLongPress = useCallback((item) => {
        toggleSelection(item);
    }, [toggleSelection]);

    // =========================================================================
    // 8. RESTORE FILES
    // =========================================================================
    const handleRestore = useCallback(async (filesToRestore) => {
        const items = Array.isArray(filesToRestore) ? filesToRestore : [filesToRestore];
        const ids = items.map(f => f.id);

        try {
            const res = await fileService.restoreFiles(ids);

            if (res.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Khôi phục thành công',
                    text2: `Đã khôi phục ${ids.length} mục`
                });

                // Xóa khỏi danh sách local
                setFiles(prev => prev.filter(f => !ids.includes(f.id)));
                setSelectedIds(new Set());
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi khôi phục',
                text2: error.response?.data?.message || 'Vui lòng thử lại'
            });
        }
    }, []);

    // =========================================================================
    // 9. DELETE PERMANENTLY
    // =========================================================================
    const openDeletePermanentModal = useCallback((items) => {
        const itemsArray = Array.isArray(items) ? items : [items];
        setFilesToDelete(itemsArray);
        setShowDeletePermanentModal(true);
    }, []);

    const closeDeletePermanentModal = useCallback(() => {
        setShowDeletePermanentModal(false);
        setFilesToDelete([]);
    }, []);

    const confirmDeletePermanent = useCallback(async () => {
        if (filesToDelete.length === 0) return;

        setDeleteLoading(true);
        const ids = filesToDelete.map(f => f.id);

        try {
            const res = await fileService.deletePermanently(ids);

            if (res.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Xóa vĩnh viễn thành công',
                    text2: `Đã xóa ${ids.length} mục`
                });

                // Xóa khỏi danh sách local
                setFiles(prev => prev.filter(f => !ids.includes(f.id)));
                setSelectedIds(new Set());
                closeDeletePermanentModal();
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi xóa vĩnh viễn',
                text2: error.response?.data?.message || 'Vui lòng thử lại'
            });
        } finally {
            setDeleteLoading(false);
        }
    }, [filesToDelete, closeDeletePermanentModal]);

    // =========================================================================
    // 10. CONTEXT MENU (3 chấm)
    // =========================================================================
    const handleMenuPress = useCallback((item) => {
        if (selectedIds.size > 0) return;

        // Menu đơn giản cho thùng rác: Khôi phục, Xóa vĩnh viễn
        const options = ['Khôi phục', 'Xóa vĩnh viễn', 'Hủy'];
        const destructiveButtonIndex = 1;
        const cancelButtonIndex = 2;

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                destructiveButtonIndex,
                title: item.name
            },
            (selectedIndex) => {
                switch (selectedIndex) {
                    case 0: // Khôi phục
                        handleRestore([item]);
                        break;
                    case 1: // Xóa vĩnh viễn
                        openDeletePermanentModal([item]);
                        break;
                }
            }
        );
    }, [selectedIds.size, showActionSheetWithOptions, handleRestore, openDeletePermanentModal]);

    // =========================================================================
    // 11. BATCH ACTIONS
    // =========================================================================
    const handleBatchAction = useCallback((actionType) => {
        const selectedItems = getSelectedItems();

        switch (actionType) {
            case BATCH_ACTIONS.RESTORE:
                handleRestore(selectedItems);
                break;
            case BATCH_ACTIONS.DELETE_PERMANENT:
                openDeletePermanentModal(selectedItems);
                break;
        }
    }, [getSelectedItems, handleRestore, openDeletePermanentModal]);

    // =========================================================================
    // 12. RENDER ITEM
    // =========================================================================
    const renderItem = useCallback(({ item }) => {
        const isSelected = selectedIds instanceof Set ? selectedIds.has(item.id) : false;

        const itemWithDeleteInfo = {
            ...item,
            isInTrash: true
        };

        if (viewMode === 'grid') {
            return (
                <FileGridItem
                    item={itemWithDeleteInfo}
                    onPress={() => handleItemPress(item)}
                    onLongPress={() => handleItemLongPress(item)}
                    onMenuPress={() => handleMenuPress(item)}
                    isSelected={isSelected}
                    showDeletedAt={true}
                />
            );
        }

        return (
            <FileItem
                item={itemWithDeleteInfo}
                onPress={() => handleItemPress(item)}
                onLongPress={() => handleItemLongPress(item)}
                isSelected={isSelected}
                onMenuPress={() => handleMenuPress(item)}
                showDeletedAt={true}
            />
        );
    }, [selectedIds, viewMode, handleItemPress, handleItemLongPress, handleMenuPress]);

    // =========================================================================
    // 13. RENDER
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
                    rootType={BREADCRUMB_ROOTS.TRASH_ROOT}
                />
            )}

            {/* Page Header */}
            {!isSubfolder && (
                <View style={styles.pageHeader}>
                    <View style={styles.pageHeaderLeft}>
                        <View style={styles.pageHeaderIcon}>
                            <FontAwesome5 name="trash" size={18} color="#DC2626" />
                        </View>
                        <View>
                            <Text style={styles.pageTitle}>
                                {isSelectionMode ? `${selectedIds.size} đã chọn` : 'Thùng rác'}
                            </Text>
                            <Text style={styles.pageSubtitle}>
                                Các tệp sẽ bị xóa vĩnh viễn sau 30 ngày
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
                    <ActivityIndicator size="large" color="#DC2626" />
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
                                fetchTrashFiles();
                            }}
                            colors={['#DC2626']}
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            type="trash"
                            title="Thùng rác trống"
                            subtitle="Các tệp bạn xóa sẽ xuất hiện ở đây"
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

            {/* BatchActionBar - variant="trash" */}
            <BatchActionBar
                selectedCount={selectedIds.size}
                selectedFiles={getSelectedItems()}
                onClearSelection={handleClearSelection}
                onAction={handleBatchAction}
                variant="trash"
            />

            {/* Modal xóa vĩnh viễn */}
            <DeletePermanentModal
                isOpen={showDeletePermanentModal}
                onClose={closeDeletePermanentModal}
                onConfirm={confirmDeletePermanent}
                count={filesToDelete.length}
                loading={deleteLoading}
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
        backgroundColor: '#FEE2E2',
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
    }
});

export default TrashScreen;