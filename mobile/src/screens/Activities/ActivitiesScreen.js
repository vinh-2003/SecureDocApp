import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { FontAwesome5 } from '@expo/vector-icons';

// Context & Services
import { AuthContext } from '../../context/AuthContext';
import activityService from '../../services/activityService';

// Constants
import { ACTIVITY_TYPES } from '../../constants/activityTypes';

// Utils
import { formatRelativeTime } from '../../utils/format';

// Components
import Header from '../../components/Header/Header';

const ActivitiesScreen = ({ navigation }) => {
    // =========================================================================
    // CONTEXT & STATE
    // =========================================================================
    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId;

    const [viewMode, setViewMode] = useState('recent'); // 'recent' | 'my'
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Pagination (cho mode 'my')
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalElements, setTotalElements] = useState(0);
    const PAGE_SIZE = 20;

    // =========================================================================
    // FETCH DATA
    // =========================================================================
    const fetchActivities = useCallback(async (pageNum = 0, isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else if (pageNum === 0) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            let response;

            if (viewMode === 'recent') {
                // Lấy hoạt động gần đây (không phân trang)
                response = await activityService.getRecentActivities(30);
                
                // Response là mảng trực tiếp
                const data = Array.isArray(response) ? response : [];
                setActivities(data);
                setTotalElements(data.length);
                setHasMore(false);
            } else {
                // Lấy hoạt động của tôi (có phân trang)
                response = await activityService.getMyActivities(pageNum, PAGE_SIZE);
                
                // Response có dạng { activities, currentPage, totalPages, totalElements, hasNext, hasPrevious }
                const newActivities = response?.activities || [];
                const totalPages = response?.totalPages || 1;
                const total = response?.totalElements || newActivities.length;

                if (pageNum === 0 || isRefresh) {
                    setActivities(newActivities);
                } else {
                    // Append và loại trùng
                    setActivities(prev => {
                        const allActivities = [...prev, ...newActivities];
                        const uniqueMap = new Map();
                        allActivities.forEach(a => uniqueMap.set(a.id, a));
                        return Array.from(uniqueMap.values());
                    });
                }

                setHasMore(pageNum < totalPages - 1);
                setTotalElements(total);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Fetch activities error:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể tải lịch sử hoạt động'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [viewMode]);

    // Initial fetch & khi đổi viewMode
    useEffect(() => {
        setActivities([]);
        setPage(0);
        setHasMore(true);
        fetchActivities(0);
    }, [viewMode]);

    // Refetch when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchActivities(0);
        }, [fetchActivities])
    );

    // =========================================================================
    // HANDLERS
    // =========================================================================
    const handleRefresh = () => {
        setPage(0);
        fetchActivities(0, true);
    };

    const handleLoadMore = () => {
        if (viewMode === 'my' && !loadingMore && hasMore && !loading) {
            fetchActivities(page + 1);
        }
    };

    const handleTargetPress = (activity) => {
        if (!activity.targetNodeExists || !activity.targetNodeId) {
            Toast.show({
                type: 'info',
                text1: 'Không tìm thấy',
                text2: 'Tài liệu này có thể đã bị xóa'
            });
            return;
        }

        if (activity.targetNodeType === 'FOLDER') {
            navigation.push('FolderDetail', {
                folderId: activity.targetNodeId,
                folderName: activity.targetNodeName
            });
        } else {
            navigation.navigate('FileViewer', {
                fileId: activity.targetNodeId,
                file: {
                    id: activity.targetNodeId,
                    name: activity.targetNodeName
                }
            });
        }
    };

    // =========================================================================
    // RENDER ACTIVITY ITEM
    // =========================================================================
    const renderActivityItem = ({ item }) => {
        const typeInfo = ACTIVITY_TYPES[item.actionType] || {
            key: item.actionType,
            label: item.actionType,
            icon: 'file-alt',
            color: '#6B7280',
            bgColor: '#F3F4F6'
        };

        const isCurrentUser = item.actor?.id === currentUserId;
        const actorName = isCurrentUser ? 'Bạn' : (item.actor?.name || item.actor?.email || 'Người dùng');

        return (
            <View style={styles.activityItem}>
                {/* Icon */}
                <View style={[styles.activityIcon, { backgroundColor: typeInfo.bgColor }]}>
                    <FontAwesome5 name={typeInfo.icon} size={14} color={typeInfo.color} />
                </View>

                {/* Content */}
                <View style={styles.activityContent}>
                    {/* Main text */}
                    <View style={styles.activityMainText}>
                        {/* Actor */}
                        <View style={styles.actorRow}>
                            {item.actor?.avatarUrl ? (
                                <Image
                                    source={{ uri: item.actor.avatarUrl }}
                                    style={styles.actorAvatar}
                                />
                            ) : (
                                <FontAwesome5 name="user-circle" size={16} color="#9CA3AF" />
                            )}
                            <Text style={styles.actorName}>{actorName}</Text>
                        </View>

                        {/* Action */}
                        <Text style={styles.actionText}>{item.actionDisplayText}</Text>

                        {/* Target */}
                        <TouchableOpacity
                            onPress={() => handleTargetPress(item)}
                            disabled={!item.targetNodeExists}
                            style={styles.targetButton}
                        >
                            <FontAwesome5
                                name={item.targetNodeType === 'FOLDER' ? 'folder' : 'file-alt'}
                                size={12}
                                color={item.targetNodeType === 'FOLDER' ? '#F59E0B' : '#6B7280'}
                            />
                            <Text
                                style={[
                                    styles.targetName,
                                    item.targetNodeExists && styles.targetNameClickable
                                ]}
                                numberOfLines={1}
                            >
                                {item.targetNodeName}
                            </Text>
                            {item.targetNodeExists && (
                                <FontAwesome5 name="external-link-alt" size={10} color="#3B82F6" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Details (nếu có) */}
                    {renderActivityDetails(item)}

                    {/* Time & Badge */}
                    <View style={styles.activityMeta}>
                        <Text style={styles.timeText}>
                            {item.relativeTime || formatRelativeTime(item.createdAt)}
                        </Text>
                        <View style={[styles.typeBadge, { backgroundColor: typeInfo.bgColor }]}>
                            <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                                {typeInfo.label}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    // Render activity details (rename, move, share, etc.)
    const renderActivityDetails = (activity) => {
        const { actionType, details } = activity;
        if (!details) return null;

        switch (actionType) {
            case 'RENAMED':
                return (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailOld} numberOfLines={1}>{details.oldName}</Text>
                        <FontAwesome5 name="arrow-right" size={10} color="#9CA3AF" />
                        <Text style={styles.detailNew} numberOfLines={1}>{details.newName}</Text>
                    </View>
                );

            case 'MOVED':
                return (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailOld} numberOfLines={1}>
                            {details.fromPath || 'Thư mục gốc'}
                        </Text>
                        <FontAwesome5 name="arrow-right" size={10} color="#9CA3AF" />
                        <Text style={styles.detailNew} numberOfLines={1}>
                            {details.toPath || 'Thư mục gốc'}
                        </Text>
                    </View>
                );

            case 'SHARED':
                return (
                    <View style={styles.detailRow}>
                        <FontAwesome5 name="user-plus" size={10} color="#10B981" />
                        <Text style={styles.detailText} numberOfLines={1}>
                            Chia sẻ với{' '}
                            <Text style={styles.detailHighlight}>{details.targetUserEmail}</Text>
                            {details.role && (
                                <Text style={styles.detailMuted}>
                                    {' '}({details.role === 'EDITOR' ? 'Chỉnh sửa' : 'Xem'})
                                </Text>
                            )}
                        </Text>
                    </View>
                );

            case 'REVOKED':
                return (
                    <View style={styles.detailRow}>
                        <FontAwesome5 name="user-minus" size={10} color="#EF4444" />
                        <Text style={styles.detailText} numberOfLines={1}>
                            Thu hồi quyền của{' '}
                            <Text style={styles.detailHighlight}>{details.targetUserEmail}</Text>
                        </Text>
                    </View>
                );

            case 'PUBLIC_ACCESS_CHANGED':
                const accessLabels = {
                    'PRIVATE': 'Riêng tư',
                    'PUBLIC_VIEW': 'Công khai (Xem)',
                    'PUBLIC_EDIT': 'Công khai (Chỉnh sửa)'
                };
                return (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailOld}>
                            {accessLabels[details.oldAccess] || details.oldAccess}
                        </Text>
                        <FontAwesome5 name="arrow-right" size={10} color="#9CA3AF" />
                        <Text style={styles.detailNew}>
                            {accessLabels[details.newAccess] || details.newAccess}
                        </Text>
                    </View>
                );

            case 'COPIED':
                return (
                    <View style={styles.detailRow}>
                        <FontAwesome5 name="copy" size={10} color="#14B8A6" />
                        <Text style={styles.detailText} numberOfLines={1}>
                            Sao chép từ{' '}
                            <Text style={styles.detailHighlight}>{details.originalNodeName}</Text>
                        </Text>
                    </View>
                );

            default:
                return null;
        }
    };

    // =========================================================================
    // RENDER
    // =========================================================================
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Header />

            {/* Page Header */}
            <View style={styles.pageHeader}>
                <View style={styles.pageHeaderIcon}>
                    <FontAwesome5 name="history" size={18} color="#3B82F6" />
                </View>
                <View style={styles.pageHeaderText}>
                    <Text style={styles.pageTitle}>Lịch sử hoạt động</Text>
                    <Text style={styles.pageSubtitle}>
                        Xem lại các thay đổi trên tài liệu
                    </Text>
                </View>
            </View>

            {/* View Mode Toggle */}
            <View style={styles.toggleContainer}>
                <View style={styles.toggleWrapper}>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            viewMode === 'recent' && styles.toggleButtonActive
                        ]}
                        onPress={() => setViewMode('recent')}
                    >
                        <FontAwesome5
                            name="clock"
                            size={14}
                            color={viewMode === 'recent' ? '#3B82F6' : '#6B7280'}
                        />
                        <Text style={[
                            styles.toggleButtonText,
                            viewMode === 'recent' && styles.toggleButtonTextActive
                        ]}>
                            Gần đây
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            viewMode === 'my' && styles.toggleButtonActive
                        ]}
                        onPress={() => setViewMode('my')}
                    >
                        <FontAwesome5
                            name="user"
                            size={14}
                            color={viewMode === 'my' ? '#3B82F6' : '#6B7280'}
                        />
                        <Text style={[
                            styles.toggleButtonText,
                            viewMode === 'my' && styles.toggleButtonTextActive
                        ]}>
                            Của tôi
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Refresh Button */}
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefresh}
                    disabled={loading || refreshing}
                >
                    <FontAwesome5 
                        name="sync" 
                        size={14} 
                        color="#6B7280" 
                        style={(loading || refreshing) && { opacity: 0.5 }}
                    />
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : (
                <FlatList
                    data={activities}
                    keyExtractor={(item, index) => item.id || `activity-${index}`}
                    renderItem={renderActivityItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#3B82F6']}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <FontAwesome5 name="history" size={40} color="#D1D5DB" />
                            </View>
                            <Text style={styles.emptyTitle}>Chưa có hoạt động</Text>
                            <Text style={styles.emptySubtitle}>
                                {viewMode === 'my'
                                    ? 'Bạn chưa thực hiện hoạt động nào'
                                    : 'Chưa có hoạt động nào được ghi nhận'
                                }
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={styles.loadingMore}>
                                <ActivityIndicator size="small" color="#3B82F6" />
                                <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
                            </View>
                        ) : activities.length > 0 ? (
                            <View style={styles.statsFooter}>
                                <Text style={styles.statsText}>
                                    Hiển thị {activities.length} / {totalElements} hoạt động
                                </Text>
                            </View>
                        ) : null
                    }
                    contentContainerStyle={[
                        styles.listContent,
                        activities.length === 0 && styles.listContentEmpty
                    ]}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6'
    },
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    pageHeaderIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    pageHeaderText: {
        flex: 1
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

    // Toggle
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    toggleWrapper: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 4
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8
    },
    toggleButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    toggleButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280'
    },
    toggleButtonTextActive: {
        color: '#3B82F6'
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center'
    },

    // Activity Item
    activityItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    activityIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2
    },
    activityContent: {
        flex: 1
    },
    activityMainText: {
        marginBottom: 6
    },
    actorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4
    },
    actorAvatar: {
        width: 18,
        height: 18,
        borderRadius: 9
    },
    actorName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937'
    },
    actionText: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4
    },
    targetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        maxWidth: '90%'
    },
    targetName: {
        fontSize: 13,
        color: '#6B7280',
        flexShrink: 1
    },
    targetNameClickable: {
        color: '#3B82F6',
        fontWeight: '500'
    },

    // Details
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6,
        flexWrap: 'wrap'
    },
    detailOld: {
        fontSize: 12,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
        maxWidth: 100
    },
    detailNew: {
        fontSize: 12,
        color: '#1F2937',
        fontWeight: '500',
        maxWidth: 100
    },
    detailText: {
        fontSize: 12,
        color: '#6B7280',
        flex: 1
    },
    detailHighlight: {
        fontWeight: '600',
        color: '#1F2937'
    },
    detailMuted: {
        color: '#9CA3AF'
    },

    // Meta
    activityMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8
    },
    timeText: {
        fontSize: 11,
        color: '#9CA3AF'
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '600'
    },

    // States
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280'
    },
    listContent: {
        paddingBottom: 100
    },
    listContentEmpty: {
        flex: 1
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center'
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
    },
    statsFooter: {
        paddingVertical: 16,
        alignItems: 'center'
    },
    statsText: {
        fontSize: 12,
        color: '#9CA3AF'
    }
});

export default ActivitiesScreen;