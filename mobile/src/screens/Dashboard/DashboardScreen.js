import React, { useEffect, useState, useContext, useCallback } from 'react';
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
import Toast from 'react-native-toast-message';

// --- CONTEXT & SERVICES ---
import { FileContext } from '../../context/FileContext';
import { AuthContext } from '../../context/AuthContext';
import fileService from '../../services/fileService';

// --- HOOKS ---
import useFileActions from '../../hooks/useFileActions';

// --- COMPONENTS ---
// 1. Header Global (Chứa Sidebar, Search, Avatar)
import Header from '../../components/Header/Header'; 

// 2. Components con của Dashboard
import FileItem from '../../components/FileExplorer/FileItem';
import FileGridItem from '../../components/FileExplorer/FileGridItem';
import FileToolbar from '../../components/FileExplorer/FileToolbar';
import EmptyState from '../../components/FileExplorer/EmptyState';
import BatchActionBar from '../../components/FileExplorer/BatchActionBar';
import DashboardStats from '../../components/Dashboard/DashboardStats';
import FAB from '../../components/Common/FAB';

// 3. Modals
import CreateFolderModal from '../../components/Dashboard/CreateFolderModal';
import RenameModal from '../../components/Dashboard/RenameModal';
import DeleteConfirmModal from '../../components/Dashboard/DeleteConfirmModal';
import FileInfoModal from '../../components/Dashboard/FileInfoModal';
import MoveFileModal from '../../components/Dashboard/MoveFileModal';
// import ShareModal from '../../components/Dashboard/ShareModal'; // Bỏ comment nếu đã tạo

const DashboardScreen = ({ navigation, route }) => {
  // 1. Params & Context
  const currentFolderId = route.params?.folderId || null;
  const folderName = route.params?.folderName || 'Tài liệu của tôi';

  const {
    setCurrentFolder,
    handleCreateFolder,
    handleRename,
    handleUploadFile,
    refreshKey
  } = useContext(FileContext);

  const { showActionSheetWithOptions } = useActionSheet();

  // 2. Local State
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI State
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [sortConfig, setSortConfig] = useState({ sortBy: 'createdAt', direction: 'desc' });
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Selection State (Multi-select)
  const [selectedIds, setSelectedIds] = useState(new Set());
  const isSelectionMode = selectedIds.size > 0;

  // 3. FETCH DATA
  const fetchData = useCallback(async () => {
    try {
      setCurrentFolder(currentFolderId);
      
      const [filesRes, statsRes] = await Promise.all([
        fileService.getFiles(currentFolderId, sortConfig.sortBy, sortConfig.direction),
        // Chỉ lấy stats ở trang chủ (root)
        !currentFolderId ? fileService.getDashboardStats() : Promise.resolve({ data: null })
      ]);

      setFiles(filesRes.data || []);
      if (statsRes.data) setStats(statsRes.data);

    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Lỗi tải dữ liệu' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentFolderId, sortConfig, setCurrentFolder]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Handle Back Button Android (Khi đang chọn file)
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


  // 4. USE FILE ACTIONS HOOK (Quản lý Logic Modals)
  const fileActions = useFileActions({
    onRefresh: fetchData,
    setSelection: setSelectedIds, // Truyền setter để hook clear selection sau khi thao tác
    handleRename,
    handleUploadFile,
    handleCreateFolder
  });

  // 5. EVENT HANDLERS

  // --- Selection Logic ---
  const toggleSelection = (item) => {
    const newIds = new Set(selectedIds);
    if (newIds.has(item.id)) {
      newIds.delete(item.id);
    } else {
      newIds.add(item.id);
    }
    setSelectedIds(newIds);
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  // --- Item Interactions ---
  const handleItemPress = (item) => {
    if (isSelectionMode) {
      toggleSelection(item);
    } else if (item.type === 'FOLDER') {
      navigation.push('FolderDetail', { 
        folderId: item.id, 
        folderName: item.name 
      });
    } else {
      navigation.navigate('FileViewer', { fileId: item.id, file: item });
    }
  };

  const handleItemLongPress = (item) => {
    toggleSelection(item);
  };

  // --- Menu Context (3 chấm) ---
  const handleMenuPress = (item) => {
    if (isSelectionMode) return;

    const options = ['Chi tiết', 'Đổi tên', 'Di chuyển', 'Xóa', 'Hủy'];
    const destructiveButtonIndex = 3;
    const cancelButtonIndex = 4;

    showActionSheetWithOptions(
      { options, cancelButtonIndex, destructiveButtonIndex, title: item.name },
      (selectedIndex) => {
        switch (selectedIndex) {
          case 0: fileActions.openInfoModal(item); break;
          case 1: fileActions.openRenameModal(item); break;
          case 2: fileActions.openMoveModal([item]); break;
          case 3: fileActions.openDeleteModal([item]); break;
        }
      }
    );
  };

  // --- Batch Actions ---
  const getSelectedItems = () => files.filter(f => selectedIds.has(f.id));

  const handleBatchDelete = () => {
    fileActions.openDeleteModal(getSelectedItems());
    // Lưu ý: selection sẽ được clear trong hook sau khi xóa thành công
  };

  const handleBatchMove = () => {
    fileActions.openMoveModal(getSelectedItems());
  };

  // 6. RENDER HELPERS
  const renderItem = ({ item }) => {
    const isSelected = selectedIds.has(item.id);
    const itemProps = {
      item,
      onPress: () => handleItemPress(item),
      onLongPress: () => handleItemLongPress(item),
      isSelected
    };

    if (viewMode === 'grid') {
      return (
        <View style={{ flex: 1, margin: 4 }}>
           <FileGridItem {...itemProps} />
           {isSelected && <View style={styles.checkBadge} />} 
        </View>
      );
    }
    
    return (
      <FileItem 
        {...itemProps}
        onMenuPress={() => handleMenuPress(item)} 
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* 1. HEADER GLOBAL (Sidebar Toggle + Search + Avatar) */}
      <Header />

      {/* 2. FILE TOOLBAR (Tên thư mục + Sort + View Mode) */}
      {/* Ẩn tiêu đề nếu đang chọn file để hiển thị số lượng */}
      <FileToolbar 
        title={isSelectionMode ? `${selectedIds.size} đã chọn` : folderName}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortValue={`${sortConfig.sortBy}-${sortConfig.direction}`}
        onSortChange={setSortConfig}
      />

      {/* 3. MAIN CONTENT */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          key={viewMode} // Re-render khi đổi view
          data={files}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={viewMode === 'grid' ? 2 : 1}
          
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
          }
          
          ListHeaderComponent={
            (!currentFolderId && !isSelectionMode) ? <DashboardStats stats={stats} /> : null
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
            paddingHorizontal: viewMode === 'grid' ? 8 : 0 
          }}
        />
      )}

      {/* 4. FAB (Ẩn khi đang chọn file) */}
      {!isSelectionMode && (
        <FAB 
          onUpload={fileActions.triggerFileUpload}
          onCreateFolder={() => setShowCreateFolder(true)}
        />
      )}

      {/* 5. BATCH ACTION BAR (Hiện khi chọn file) */}
      <BatchActionBar 
        selectedCount={selectedIds.size}
        onClear={handleClearSelection}
        onDelete={handleBatchDelete}
        onMove={handleBatchMove}
      />

      {/* 6. MODALS */}
      <RenameModal 
        isOpen={fileActions.showRenameModal}
        onClose={() => fileActions.setShowRenameModal(false)}
        onSubmit={fileActions.submitRename}
        currentName={fileActions.fileToRename?.name}
      />

      <DeleteConfirmModal
        isOpen={fileActions.showDeleteModal}
        onClose={() => fileActions.setShowDeleteModal(false)}
        onConfirm={fileActions.executeDelete}
        count={fileActions.filesToDelete.length}
        loading={fileActions.deleting}
      />

      <FileInfoModal
        isOpen={fileActions.showInfoModal}
        onClose={() => fileActions.setShowInfoModal(false)}
        file={fileActions.infoData}
      />

      <MoveFileModal
        isOpen={fileActions.showMoveModal}
        onClose={fileActions.closeMoveModal}
        selectedItems={fileActions.filesToDelete} 
        onSuccess={fileActions.handleMoveSuccess}
      />

      {/* Create Folder (Local State) */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onSubmit={async (name) => {
            const success = await handleCreateFolder(name);
            if (success) fetchData();
        }}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  checkBadge: {
    position: 'absolute', top: 8, right: 8, width: 14, height: 14, 
    borderRadius: 7, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: 'white',
    zIndex: 10
  }
});

export default DashboardScreen;