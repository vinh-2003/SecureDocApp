import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    ScrollView
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import CustomModal from '../Common/CustomModal';
import fileService from '../../services/fileService';

/**
 * Modal di chuyển file/folder
 * Đồng bộ với MoveFileModal.jsx trên Web
 */
const MoveFileModal = ({ isOpen, onClose, onSuccess, selectedItems = [] }) => {
    // State quản lý việc duyệt folder trong modal
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [folders, setFolders] = useState([]);
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Thư mục gốc' }]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Reset state khi mở modal
    useEffect(() => {
        if (isOpen) {
            setCurrentFolderId(null);
            setBreadcrumbs([{ id: null, name: 'Thư mục gốc' }]);
            fetchFolders(null);
        }
    }, [isOpen]);

    /**
     * Lấy danh sách folder
     */
    const fetchFolders = useCallback(async (parentId) => {
        setLoading(true);
        try {
            const res = await fileService.getFiles(parentId);

            if (res.success || res.data) {
                const validFolders = (res.data || []).filter(item => {
                    const isFolder = item.type === 'FOLDER';
                    const isNotSelf = !selectedItems?.some(selected => selected?.id === item.id);
                    return isFolder && isNotSelf;
                });
                setFolders(validFolders);
            }
        } catch (error) {
            console.error('Lỗi tải thư mục:', error);
            Toast.show({ type: 'error', text1: 'Không thể tải danh sách thư mục' });
        } finally {
            setLoading(false);
        }
    }, [selectedItems]);

    /**
     * Đi vào folder
     */
    const handleEnterFolder = useCallback((folder) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
        fetchFolders(folder.id);
    }, [fetchFolders]);

    /**
     * Click breadcrumb
     */
    const handleBreadcrumbClick = useCallback((crumb, index) => {
        setCurrentFolderId(crumb.id);
        setBreadcrumbs(prev => prev.slice(0, index + 1));
        fetchFolders(crumb.id);
    }, [fetchFolders]);

    /**
     * Đóng modal - KHÔNG clear selection
     */
    const handleClose = useCallback(() => {
        setCurrentFolderId(null);
        setBreadcrumbs([{ id: null, name: 'Thư mục gốc' }]);
        setFolders([]);
        onClose();
    }, [onClose]);

    /**
     * Xác nhận di chuyển
     */
    const handleConfirmMove = useCallback(async () => {
        if (!selectedItems || selectedItems.length === 0) {
            Toast.show({ type: 'error', text1: 'Chưa chọn file để di chuyển' });
            return;
        }

        setSubmitting(true);
        try {
            const itemIds = selectedItems.map(item => item.id);
            const res = await fileService.moveFiles(itemIds, currentFolderId);

            if (res.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Di chuyển thành công',
                    text2: res.message || `Đã di chuyển ${selectedItems.length} mục`
                });

                // Reset state
                setCurrentFolderId(null);
                setBreadcrumbs([{ id: null, name: 'Thư mục gốc' }]);
                setFolders([]);

                // Gọi onSuccess để clear selection và refresh
                if (onSuccess) {
                    onSuccess();
                }
            }
        } catch (error) {
            console.error('Move error:', error);
            Toast.show({
                type: 'error',
                text1: 'Di chuyển thất bại',
                text2: error.response?.data?.message || 'Vui lòng thử lại'
            });
        } finally {
            setSubmitting(false);
        }
    }, [selectedItems, currentFolderId, onSuccess]);

    /**
     * Render folder item
     */
    const renderFolderItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.folderItem}
            onPress={() => handleEnterFolder(item)}
            activeOpacity={0.7}
        >
            <View style={styles.folderIconContainer}>
                <FontAwesome5 name="folder" size={20} color="#F59E0B" solid />
            </View>
            <Text style={styles.folderName} numberOfLines={1}>
                {item.name}
            </Text>
            <FontAwesome5 name="chevron-right" size={12} color="#9CA3AF" />
        </TouchableOpacity>
    ), [handleEnterFolder]);

    /**
     * Render empty state
     */
    const renderEmptyState = useCallback(() => (
        <View style={styles.emptyContainer}>
            <FontAwesome5 name="folder-open" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>Thư mục trống</Text>
            <Text style={styles.emptySubtext}>Bạn có thể di chuyển vào đây</Text>
        </View>
    ), []);

    if (!isOpen) return null;

    return (
        <CustomModal visible={isOpen} onClose={handleClose}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <FontAwesome5 name="arrows-alt" size={16} color="#2563EB" />
                </View>
                <Text style={styles.headerTitle}>
                    Di chuyển {selectedItems?.length || 0} mục
                </Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <FontAwesome5 name="times" size={18} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Breadcrumbs */}
            <View style={styles.breadcrumbsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.breadcrumbsContent}
                >
                    {breadcrumbs.map((crumb, index) => (
                        <View key={crumb.id || 'root'} style={styles.breadcrumbItem}>
                            {index > 0 && (
                                <Text style={styles.breadcrumbSeparator}>/</Text>
                            )}
                            <TouchableOpacity
                                onPress={() => handleBreadcrumbClick(crumb, index)}
                                style={styles.breadcrumbButton}
                            >
                                {index === 0 && (
                                    <FontAwesome5
                                        name="home"
                                        size={12}
                                        color={index === breadcrumbs.length - 1 ? '#1F2937' : '#6B7280'}
                                        style={styles.homeIcon}
                                    />
                                )}
                                <Text
                                    style={[
                                        styles.breadcrumbText,
                                        index === breadcrumbs.length - 1 && styles.breadcrumbTextActive
                                    ]}
                                    numberOfLines={1}
                                >
                                    {crumb.name}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Folder List */}
            <View style={styles.listContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={folders}
                        keyExtractor={(item) => item.id}
                        renderItem={renderFolderItem}
                        ListEmptyComponent={renderEmptyState}
                        contentContainerStyle={folders.length === 0 ? styles.emptyListContent : undefined}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Location Indicator */}
            <View style={styles.locationIndicator}>
                <FontAwesome5 name="map-marker-alt" size={12} color="#6B7280" />
                <Text style={styles.locationText}>
                    Vị trí: {breadcrumbs[breadcrumbs.length - 1]?.name}
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleClose}
                    style={styles.cancelButton}
                    disabled={submitting}
                >
                    <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleConfirmMove}
                    style={[styles.moveButton, (submitting || loading) && styles.buttonDisabled]}
                    disabled={submitting || loading}
                    activeOpacity={0.8}
                >
                    {submitting ? (
                        <>
                            <ActivityIndicator size="small" color="white" />
                            <Text style={styles.moveButtonText}>Đang chuyển...</Text>
                        </>
                    ) : (
                        <>
                            <FontAwesome5 name="check" size={14} color="white" />
                            <Text style={styles.moveButtonText}>Chuyển đến đây</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 12
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    headerTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    closeButton: {
        padding: 8
    },
    breadcrumbsWrapper: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        marginBottom: 12
    },
    breadcrumbsContent: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center'
    },
    breadcrumbItem: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    breadcrumbSeparator: {
        color: '#9CA3AF',
        marginHorizontal: 8,
        fontSize: 14
    },
    breadcrumbButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 2
    },
    homeIcon: {
        marginRight: 4
    },
    breadcrumbText: {
        fontSize: 13,
        color: '#6B7280'
    },
    breadcrumbTextActive: {
        fontWeight: '600',
        color: '#1F2937'
    },
    listContainer: {
        height: 280,
        backgroundColor: '#FAFAFA',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    folderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    folderIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    folderName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#374151'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: '#6B7280',
        fontSize: 14
    },
    emptyListContent: {
        flex: 1
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        fontWeight: '500',
        color: '#6B7280'
    },
    emptySubtext: {
        marginTop: 4,
        fontSize: 13,
        color: '#9CA3AF'
    },
    locationIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6
    },
    locationText: {
        fontSize: 12,
        color: '#6B7280'
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        alignItems: 'center'
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563'
    },
    moveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#2563EB',
        borderRadius: 10,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3
    },
    buttonDisabled: {
        opacity: 0.6
    },
    moveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white'
    }
});

export default MoveFileModal;