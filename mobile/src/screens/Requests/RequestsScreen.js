import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Image,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { FontAwesome5 } from '@expo/vector-icons';

// Services
import fileService from '../../services/fileService';
import userService from '../../services/userService';

// Utils
import { formatDate } from '../../utils/format';

// Components
import Header from '../../components/Header/Header';

const RequestsScreen = ({ navigation }) => {
    // =========================================================================
    // STATE
    // =========================================================================
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    // =========================================================================
    // FETCH DATA
    // =========================================================================
    const fetchRequests = useCallback(async () => {
        try {
            const res = await fileService.getIncomingRequests();

            if (res.success && res.data && res.data.length > 0) {
                const rawRequests = res.data;

                // Làm giàu dữ liệu: Lấy thông tin file và user
                const enrichedRequests = await Promise.all(
                    rawRequests.map(async (req) => {
                        try {
                            // Lấy thông tin File và User song song
                            const [fileRes, userRes] = await Promise.all([
                                fileService.getFileDetails(req.fileId).catch(() => null),
                                userService.getUserById(req.requesterId).catch(() => null)
                            ]);

                            const fileData = fileRes?.data;
                            const userData = userRes?.data;

                            return {
                                ...req,
                                // File info
                                fileName: fileData?.name || 'Tài liệu không xác định',
                                mimeType: fileData?.mimeType || '',
                                // User info
                                requesterName: userData?.fullName || userData?.username || 'Người dùng',
                                requesterEmail: userData?.email || '',
                                requesterAvatar: userData?.avatarUrl || null
                            };
                        } catch (e) {
                            return {
                                ...req,
                                fileName: 'Tài liệu không xác định',
                                mimeType: '',
                                requesterName: 'Người dùng',
                                requesterEmail: '',
                                requesterAvatar: null
                            };
                        }
                    })
                );

                setRequests(enrichedRequests);
            } else {
                setRequests([]);
            }
        } catch (error) {
            console.error('Fetch requests error:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể tải danh sách yêu cầu'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // Refetch when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchRequests();
        }, [fetchRequests])
    );

    // =========================================================================
    // HANDLERS
    // =========================================================================
    const handleRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const handleFilePress = (req) => {
        // Mở file viewer
        navigation.navigate('FileViewer', {
            fileId: req.fileId,
            file: {
                id: req.fileId,
                name: req.fileName,
                mimeType: req.mimeType
            }
        });
    };

    const handleProcess = (request, isApproved) => {
        const action = isApproved ? 'duyệt' : 'từ chối';
        
        Alert.alert(
            isApproved ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu',
            `Bạn có chắc muốn ${action} yêu cầu truy cập từ ${request.requesterName}?`,
            [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: isApproved ? 'Duyệt' : 'Từ chối',
                    style: isApproved ? 'default' : 'destructive',
                    onPress: () => executeProcess(request.id, isApproved)
                }
            ]
        );
    };

    const executeProcess = async (requestId, isApproved) => {
        setProcessingId(requestId);

        try {
            const res = await fileService.processAccessRequest(requestId, isApproved);

            if (res.success) {
                Toast.show({
                    type: 'success',
                    text1: isApproved ? 'Đã duyệt' : 'Đã từ chối',
                    text2: isApproved ? 'Đã cấp quyền truy cập' : 'Đã từ chối yêu cầu'
                });

                // Xóa request khỏi danh sách
                setRequests(prev => prev.filter(r => r.id !== requestId));
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Xử lý thất bại. Vui lòng thử lại.'
            });
        } finally {
            setProcessingId(null);
        }
    };

    // =========================================================================
    // RENDER ITEM
    // =========================================================================
    const renderRequestItem = ({ item }) => {
        const isProcessing = processingId === item.id;
        const pageNumbers = item.pageIndexes?.map(i => i + 1).join(', ') || '';

        return (
            <View style={styles.card}>
                {/* Header: User info */}
                <View style={styles.cardHeader}>
                    {item.requesterAvatar ? (
                        <Image
                            source={{ uri: item.requesterAvatar }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <FontAwesome5 name="user" size={16} color="#fff" />
                        </View>
                    )}
                    <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {item.requesterName}
                        </Text>
                        <Text style={styles.userEmail} numberOfLines={1}>
                            {item.requesterEmail}
                        </Text>
                    </View>
                    <View style={styles.timeBadge}>
                        <FontAwesome5 name="clock" size={10} color="#9CA3AF" />
                        <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
                    </View>
                </View>

                {/* File info */}
                <TouchableOpacity
                    style={styles.fileRow}
                    onPress={() => handleFilePress(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.fileIcon}>
                        <FontAwesome5 name="file-alt" size={16} color="#3B82F6" />
                    </View>
                    <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                            {item.fileName}
                        </Text>
                        <Text style={styles.fileId} numberOfLines={1}>
                            ID: {item.fileId?.substring(0, 12)}...
                        </Text>
                    </View>
                    <FontAwesome5 name="external-link-alt" size={12} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Page info */}
                <View style={styles.pageRow}>
                    <View style={styles.pageBadge}>
                        <FontAwesome5 name="file" size={10} color="#7C3AED" />
                        <Text style={styles.pageBadgeText}>
                            {item.pageIndexes?.length || 0} trang
                        </Text>
                    </View>
                    {pageNumbers && (
                        <Text style={styles.pageNumbers}>
                            Trang: {pageNumbers}
                        </Text>
                    )}
                </View>

                {/* Reason */}
                {item.reason && (
                    <View style={styles.reasonBox}>
                        <FontAwesome5 name="quote-left" size={10} color="#9CA3AF" style={styles.quoteIcon} />
                        <Text style={styles.reasonText} numberOfLines={3}>
                            {item.reason}
                        </Text>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleProcess(item, false)}
                        disabled={isProcessing}
                        activeOpacity={0.7}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                            <>
                                <FontAwesome5 name="times" size={14} color="#DC2626" />
                                <Text style={styles.rejectBtnText}>Từ chối</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => handleProcess(item, true)}
                        disabled={isProcessing}
                        activeOpacity={0.7}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <FontAwesome5 name="check" size={14} color="#fff" />
                                <Text style={styles.approveBtnText}>Duyệt</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
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
                    <FontAwesome5 name="user-shield" size={18} color="#3B82F6" />
                </View>
                <View style={styles.pageHeaderText}>
                    <Text style={styles.pageTitle}>Yêu cầu truy cập</Text>
                    <Text style={styles.pageSubtitle}>
                        Duyệt các yêu cầu xem tài liệu bị khóa
                    </Text>
                </View>
                {requests.length > 0 && (
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{requests.length}</Text>
                    </View>
                )}
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRequestItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#3B82F6']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <FontAwesome5 name="check-circle" size={48} color="#10B981" />
                            </View>
                            <Text style={styles.emptyTitle}>Tuyệt vời!</Text>
                            <Text style={styles.emptySubtitle}>
                                Bạn đã xử lý hết các yêu cầu
                            </Text>
                        </View>
                    }
                    contentContainerStyle={[
                        styles.listContent,
                        requests.length === 0 && styles.listContentEmpty
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
    countBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4
    },
    countText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold'
    },
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
        padding: 16,
        paddingBottom: 100
    },
    listContentEmpty: {
        flex: 1
    },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    userInfo: {
        flex: 1
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937'
    },
    userEmail: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    timeText: {
        fontSize: 10,
        color: '#6B7280'
    },

    // File row
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10
    },
    fileIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    fileInfo: {
        flex: 1
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF'
    },
    fileId: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
        fontFamily: 'monospace'
    },

    // Page row
    pageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8
    },
    pageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12
    },
    pageBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#7C3AED'
    },
    pageNumbers: {
        fontSize: 12,
        color: '#6B7280'
    },

    // Reason
    reasonBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    quoteIcon: {
        marginBottom: 4
    },
    reasonText: {
        fontSize: 13,
        color: '#4B5563',
        fontStyle: 'italic',
        lineHeight: 18
    },

    // Actions
    actions: {
        flexDirection: 'row',
        gap: 10
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10
    },
    rejectBtn: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA'
    },
    rejectBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626'
    },
    approveBtn: {
        backgroundColor: '#3B82F6'
    },
    approveBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff'
    },

    // Empty state
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
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center'
    }
});

export default RequestsScreen;