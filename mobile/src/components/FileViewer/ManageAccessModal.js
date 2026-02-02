import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Image,
    Alert
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Hooks
import useAccessList from '../../hooks/useAccessList';

const ManageAccessModal = ({ visible, onClose, fileId }) => {
    // Sử dụng hook
    const {
        groupedUsers,
        loading,
        searchTerm,
        confirmOpen,
        revoking,
        targetRevoke,
        setSearchTerm,
        openRevokeConfirm,
        closeRevokeConfirm,
        confirmRevoke
    } = useAccessList(fileId, visible);

    // Handle revoke với Alert
    const handleRevoke = (userId, pageIndex) => {
        Alert.alert(
            'Xác nhận thu hồi',
            `Thu hồi quyền xem Trang ${pageIndex + 1}?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Thu hồi',
                    style: 'destructive',
                    onPress: () => {
                        openRevokeConfirm(userId, pageIndex);
                        // Thực hiện ngay sau khi confirm
                        setTimeout(() => confirmRevoke(), 100);
                    }
                }
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIcon}>
                                <FontAwesome5 name="shield-alt" size={16} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Quản lý quyền truy cập</Text>
                                <Text style={styles.headerSubtitle}>
                                    Kiểm soát ai đang xem trang nào
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <FontAwesome5 name="times" size={18} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View style={styles.searchContainer}>
                        <FontAwesome5 name="search" size={14} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            placeholderTextColor="#9CA3AF"
                        />
                        {searchTerm.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchTerm('')}>
                                <FontAwesome5 name="times-circle" size={14} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Content */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {loading ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color="#3B82F6" />
                            </View>
                        ) : groupedUsers.length === 0 ? (
                            <View style={styles.emptyState}>
                                <FontAwesome5 name="shield-alt" size={40} color="#D1D5DB" />
                                <Text style={styles.emptyText}>
                                    {searchTerm
                                        ? 'Không tìm thấy người dùng nào'
                                        : 'Chưa có quyền nào được cấp'}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.userList}>
                                {groupedUsers.map(user => (
                                    <UserAccessCard
                                        key={user.userId}
                                        user={user}
                                        onRevoke={handleRevoke}
                                        revoking={revoking}
                                    />
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            {groupedUsers.length > 0 && `${groupedUsers.length} người dùng có quyền`}
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Sub-component: User Access Card
const UserAccessCard = ({ user, onRevoke, revoking }) => {
    return (
        <View style={styles.userCard}>
            {/* User Info */}
            <View style={styles.userInfo}>
                {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                ) : (
                    <View style={styles.userAvatarPlaceholder}>
                        <FontAwesome5 name="user" size={16} color="#9CA3AF" />
                    </View>
                )}
                <View style={styles.userDetails}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {user.fullName || 'Không có tên'}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                        {user.email}
                    </Text>
                </View>
            </View>

            {/* Pages */}
            <View style={styles.pagesSection}>
                <Text style={styles.pagesSectionTitle}>
                    Các trang được phép xem ({user.pages.length})
                </Text>
                <View style={styles.pagesTags}>
                    {user.pages.sort((a, b) => a - b).map(pageIndex => (
                        <View key={pageIndex} style={styles.pageTag}>
                            <Text style={styles.pageTagText}>Trang {pageIndex + 1}</Text>
                            <TouchableOpacity
                                style={styles.revokeButton}
                                onPress={() => onRevoke(user.userId, pageIndex)}
                                disabled={revoking}
                            >
                                <FontAwesome5 name="times" size={10} color="#059669" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 20,
        marginVertical: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937'
    },
    content: {
        flex: 1,
        paddingHorizontal: 20
    },
    center: {
        paddingVertical: 60,
        alignItems: 'center'
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center'
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 12,
        fontStyle: 'italic'
    },
    userList: {
        gap: 12,
        paddingVertical: 8
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    userAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    userDetails: {
        flex: 1
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937'
    },
    userEmail: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },
    pagesSection: {
        marginTop: 12
    },
    pagesSectionTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8
    },
    pagesTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    pageTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#A7F3D0'
    },
    pageTagText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#059669'
    },
    revokeButton: {
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280'
    },
    closeButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 8
    },
    closeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151'
    }
});

export default ManageAccessModal;