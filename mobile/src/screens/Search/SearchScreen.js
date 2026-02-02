import React, { useState, useContext, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    BackHandler,
    Keyboard,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActionSheet } from '@expo/react-native-action-sheet';
import Toast from 'react-native-toast-message';
import { FontAwesome5 } from '@expo/vector-icons';

// --- CONTEXT & SERVICES ---
import { AuthContext } from '../../context/AuthContext';
import fileService from '../../services/fileService';

// --- HOOKS ---
import useFileActions from '../../hooks/useFileActions';
import useSearchPreview from '../../hooks/useSearchPreview';
import useImageSearch from '../../hooks/useImageSearch';

// --- UTILS ---
import {
    getMenuOptions,
    toActionSheetFormat,
    handleActionSheetSelection
} from '../../utils/menuHelper';

// --- COMPONENTS ---
import FileItem from '../../components/FileExplorer/FileItem';
import FileGridItem from '../../components/FileExplorer/FileGridItem';
import EmptyState from '../../components/FileExplorer/EmptyState';
import BatchActionBar, { BATCH_ACTIONS } from '../../components/FileExplorer/BatchActionBar';
import ViewModeToggle from '../../components/Common/ViewModeToggle';
import FilterChips from '../../components/Search/FilterChips';

// Modals
import RenameModal from '../../components/Dashboard/RenameModal';
import DescriptionModal from '../../components/Dashboard/DescriptionModal';
import DeleteConfirmModal from '../../components/Dashboard/DeleteConfirmModal';
import FileInfoModal from '../../components/Dashboard/FileInfoModal';
import MoveFileModal from '../../components/Dashboard/MoveFileModal';
import ShareModal from '../../components/Dashboard/ShareModal';
import ConfirmRevokeModal from '../../components/Dashboard/ConfirmRevokeModal';
import AdvancedSearchModal from '../../components/Search/AdvancedSearchModal';

const SearchScreen = ({ navigation, route }) => {
    // =========================================================================
    // 1. CONTEXT & PARAMS
    // =========================================================================
    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId;

    const { showActionSheetWithOptions } = useActionSheet();

    // Nhận image results từ navigation (nếu có)
    const imageSearchResults = route.params?.imageResults || null;
    const imageSearchName = route.params?.imageName || null;
    const imageSearchPreview = route.params?.imagePreview || null;

    // =========================================================================
    // 2. LOCAL STATE
    // =========================================================================
    const [advancedFilters, setAdvancedFilters] = useState({});
    const [showAdvancedModal, setShowAdvancedModal] = useState(false);

    // UI State
    const [viewMode, setViewMode] = useState('list');

    // Selection State
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const isSelectionMode = selectedIds.size > 0;

    // Image Search State
    const [isImageSearchMode, setIsImageSearchMode] = useState(false);

    // =========================================================================
    // 3. HOOKS
    // =========================================================================
    const {
        keyword,
        setKeyword,
        results,
        isSearching,
        triggerSearch,
        reset: resetSearch
    } = useSearchPreview({
        debounceMs: 500,
        extraFilters: advancedFilters
    });

    const {
        isSearching: isImageSearching,
        showImagePicker
    } = useImageSearch({
        onSuccess: (data, imageName, imagePreview) => {
            // Set state trực tiếp thay vì navigate
            setIsImageSearchMode(true);
            // Update route params
            navigation.setParams({
                imageResults: data,
                imageName: imageName,
                imagePreview: imagePreview
            });
        }
    });

    // =========================================================================
    // 4. HANDLE IMAGE SEARCH RESULTS FROM NAVIGATION
    // =========================================================================
    useEffect(() => {
        if (imageSearchResults) {
            setIsImageSearchMode(true);
        }
    }, [imageSearchResults]);

    // Xác định kết quả hiển thị
    const displayResults = isImageSearchMode && imageSearchResults
        ? imageSearchResults
        : results;

    // =========================================================================
    // 5. FILE ACTIONS HOOK
    // =========================================================================
    const handleRename = useCallback(async (item, newName) => {
        try {
            const isFolder = item.type === 'FOLDER';
            const res = isFolder
                ? await fileService.renameFolder(item.id, newName)
                : await fileService.renameFile(item.id, newName);

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Đã đổi tên thành công' });
                triggerSearch(advancedFilters);
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
    }, [triggerSearch, advancedFilters]);

    const handleUpdateDescription = useCallback(async (item, description) => {
        try {
            const isFolder = item.type === 'FOLDER';
            const res = isFolder
                ? await fileService.updateFolderDescription(item.id, description)
                : await fileService.updateFileDescription(item.id, description);

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Đã cập nhật mô tả' });
                triggerSearch(advancedFilters);
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
    }, [triggerSearch, advancedFilters]);

    const fileActions = useFileActions({
        onRefresh: () => triggerSearch(advancedFilters),
        setSelection: setSelectedIds,
        handleRename,
        handleUpdateDescription
    });

    // =========================================================================
    // 6. HANDLE BACK BUTTON
    // =========================================================================
    useEffect(() => {
        const backAction = () => {
            if (isSelectionMode) {
                setSelectedIds(new Set());
                return true;
            }
            if (isImageSearchMode) {
                handleClearImageSearch();
                return true;
            }
            return false;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [isSelectionMode, isImageSearchMode]);

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
        return displayResults.filter(f => selectedIds.has(f.id));
    }, [displayResults, selectedIds]);

    // =========================================================================
    // 8. SEARCH HANDLERS
    // =========================================================================
    const handleSubmit = useCallback(() => {
        Keyboard.dismiss();
        triggerSearch(advancedFilters);
    }, [triggerSearch, advancedFilters]);

    const handleClearInput = useCallback(() => {
        setKeyword('');
        if (Object.keys(advancedFilters).length === 0) {
            resetSearch();
        }
    }, [setKeyword, resetSearch, advancedFilters]);

    const handleClearImageSearch = useCallback(() => {
        setIsImageSearchMode(false);
        navigation.setParams({
            imageResults: null,
            imageName: null,
            imagePreview: null
        });
    }, [navigation]);

    // =========================================================================
    // 9. FILTER HANDLERS
    // =========================================================================
    const handleApplyFilters = useCallback((newFilters) => {
        setAdvancedFilters(newFilters);
        setShowAdvancedModal(false);
        triggerSearch(newFilters);
    }, [triggerSearch]);

    const handleRemoveFilter = useCallback((key) => {
        const newFilters = { ...advancedFilters };
        delete newFilters[key];
        
        // Xóa các field liên quan
        if (key === 'date') {
            delete newFilters.fromDate;
            delete newFilters.toDate;
        }
        
        setAdvancedFilters(newFilters);
        triggerSearch(newFilters);
    }, [advancedFilters, triggerSearch]);

    const handleClearAllFilters = useCallback(() => {
        setAdvancedFilters({});
        triggerSearch({});
    }, [triggerSearch]);

    // =========================================================================
    // 10. ITEM INTERACTION HANDLERS
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
    // 11. CONTEXT MENU
    // =========================================================================
    const handleMenuPress = useCallback((item) => {
        if (selectedIds.size > 0) return;

        const menuOptions = getMenuOptions(item, {
            currentUserId,
            isSharedContext: false,
            isTrashContext: advancedFilters.inTrash || false
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
    }, [selectedIds.size, currentUserId, advancedFilters.inTrash, showActionSheetWithOptions, fileActions]);

    // =========================================================================
    // 12. BATCH ACTIONS
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
        }
    }, [getSelectedItems, fileActions]);

    // =========================================================================
    // 13. RENDER ITEM
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
    // 14. RENDER HEADER
    // =========================================================================
    const renderHeader = () => (
        <View>
            {/* Image Search Preview */}
            {isImageSearchMode && imageSearchPreview && (
                <View style={styles.imageSearchBanner}>
                    <Image
                        source={{ uri: imageSearchPreview }}
                        style={styles.imagePreview}
                    />
                    <View style={styles.imageSearchInfo}>
                        <Text style={styles.imageSearchTitle}>Tìm kiếm bằng hình ảnh</Text>
                        <Text style={styles.imageSearchSubtitle} numberOfLines={1}>
                            {imageSearchName}
                        </Text>
                        <Text style={styles.imageSearchCount}>
                            {displayResults.length} kết quả tương tự
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.clearImageButton}
                        onPress={handleClearImageSearch}
                    >
                        <FontAwesome5 name="times" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Filter Chips */}
            {!isImageSearchMode && Object.keys(advancedFilters).length > 0 && (
                <FilterChips
                    filters={advancedFilters}
                    onRemove={handleRemoveFilter}
                    onClearAll={handleClearAllFilters}
                />
            )}

            {/* Results Count */}
            {displayResults.length > 0 && !isSearching && (
                <View style={styles.resultsHeader}>
                    <Text style={styles.resultsCount}>
                        {displayResults.length} kết quả
                        {keyword.trim() ? ` cho "${keyword}"` : ''}
                    </Text>
                    <ViewModeToggle
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />
                </View>
            )}
        </View>
    );

    // =========================================================================
    // 15. RENDER
    // =========================================================================
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <FontAwesome5 name="arrow-left" size={18} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tìm kiếm</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
                <View style={styles.searchInputWrapper}>
                    <FontAwesome5 name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm tài liệu, thư mục..."
                        placeholderTextColor="#9CA3AF"
                        value={keyword}
                        onChangeText={setKeyword}
                        onSubmitEditing={handleSubmit}
                        returnKeyType="search"
                        autoFocus={!isImageSearchMode}
                    />
                    {keyword.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={handleClearInput}
                        >
                            <FontAwesome5 name="times-circle" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Image Search Button */}
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={showImagePicker}
                    disabled={isImageSearching}
                >
                    {isImageSearching ? (
                        <ActivityIndicator size="small" color="#7C3AED" />
                    ) : (
                        <FontAwesome5 name="camera" size={18} color="#7C3AED" />
                    )}
                </TouchableOpacity>

                {/* Advanced Search Button */}
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        Object.keys(advancedFilters).length > 0 && styles.actionButtonActive
                    ]}
                    onPress={() => setShowAdvancedModal(true)}
                >
                    <FontAwesome5 
                        name="sliders-h" 
                        size={18} 
                        color={Object.keys(advancedFilters).length > 0 ? '#fff' : '#3B82F6'} 
                    />
                </TouchableOpacity>
            </View>

            {/* Content */}
            {isSearching ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.searchingText}>Đang tìm kiếm...</Text>
                </View>
            ) : (
                <FlatList
                    key={viewMode}
                    data={displayResults}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={
                        keyword.trim() || Object.keys(advancedFilters).length > 0 || isImageSearchMode ? (
                            <EmptyState
                                type="search"
                                title="Không tìm thấy kết quả"
                                subtitle={
                                    isImageSearchMode
                                        ? "Không tìm thấy hình ảnh tương tự"
                                        : "Thử thay đổi từ khóa hoặc bộ lọc"
                                }
                            />
                        ) : (
                            <View style={styles.initialState}>
                                <FontAwesome5 name="search" size={48} color="#D1D5DB" />
                                <Text style={styles.initialTitle}>Tìm kiếm tài liệu</Text>
                                <Text style={styles.initialSubtitle}>
                                    Nhập từ khóa, sử dụng bộ lọc nâng cao{'\n'}hoặc tìm kiếm bằng hình ảnh
                                </Text>
                            </View>
                        )
                    }
                    contentContainerStyle={{
                        paddingBottom: 100,
                        paddingHorizontal: viewMode === 'grid' ? 4 : 0,
                        flexGrow: displayResults.length === 0 ? 1 : undefined
                    }}
                    extraData={selectedIds}
                />
            )}

            {/* Batch Action Bar */}
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

            <AdvancedSearchModal
                visible={showAdvancedModal}
                onClose={() => setShowAdvancedModal(false)}
                initialValues={advancedFilters}
                onApply={handleApplyFilters}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    backButton: {
        padding: 8,
        marginRight: 12
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 8
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44
    },
    searchIcon: {
        marginRight: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937'
    },
    clearButton: {
        padding: 4
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionButtonActive: {
        backgroundColor: '#3B82F6'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    searchingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280'
    },
    imageSearchBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DDD6FE'
    },
    imagePreview: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12
    },
    imageSearchInfo: {
        flex: 1
    },
    imageSearchTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7C3AED'
    },
    imageSearchSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },
    imageSearchCount: {
        fontSize: 12,
        color: '#7C3AED',
        fontWeight: '500',
        marginTop: 2
    },
    clearImageButton: {
        padding: 8
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    resultsCount: {
        fontSize: 14,
        color: '#6B7280'
    },
    initialState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 60
    },
    initialTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16
    },
    initialSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20
    }
});

export default SearchScreen;