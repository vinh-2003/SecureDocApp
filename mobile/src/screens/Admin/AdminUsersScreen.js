import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TextInput, 
    TouchableOpacity, ActivityIndicator, Alert, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';

// Components & Services
import Header from '../../components/Header/Header';
import { PageHeader, Loading } from '../../components/Common';
import UserStatusBadge from '../../components/Admin/UserStatusBadge';
import RoleSelectModal from '../../components/Admin/RoleSelectModal';

import useAdminUsers from '../../hooks/useAdminUsers';
import adminService from '../../services/adminService';
import authService from '../../services/authService';

const AdminUsersScreen = () => {
    const { 
        users, loading, refreshing, loadingMore, keyword, 
        setKeyword, onRefresh, onLoadMore, refreshData 
    } = useAdminUsers();

    // Modal States
    const [roleModalVisible, setRoleModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // --- HANDLERS ---
    
    // 1. Lock/Unlock
    const handleLockPress = (user) => {
        const isLocking = user.accountNonLocked;
        Alert.alert(
            isLocking ? 'Vô hiệu hóa tài khoản' : 'Mở khóa tài khoản',
            isLocking 
                ? `Bạn có chắc chắn muốn vô hiệu hóa "${user.username}"?`
                : `Mở khóa tài khoản cho "${user.username}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                { 
                    text: isLocking ? 'Vô hiệu hóa' : 'Mở khóa', 
                    style: isLocking ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            await adminService.updateUserStatus(user.id, isLocking);
                            Alert.alert('Thành công', isLocking ? 'Đã khóa tài khoản' : 'Đã mở khóa');
                            refreshData();
                        } catch (error) {
                            Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật trạng thái');
                        }
                    }
                }
            ]
        );
    };

    // 2. Resend Email
    const handleResendEmail = (user) => {
        Alert.alert(
            'Gửi lại email',
            `Gửi lại email kích hoạt tới "${user.email}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                { 
                    text: 'Gửi ngay', 
                    onPress: async () => {
                        try {
                            await authService.resendVerification(user.email);
                            Alert.alert('Thành công', `Đã gửi email tới ${user.email}`);
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể gửi email');
                        }
                    }
                }
            ]
        );
    };

    // 3. Open Role Modal
    const openRoleModal = (user) => {
        setSelectedUser(user);
        setRoleModalVisible(true);
    };

    // 4. Update Role Logic
    const handleUpdateRoles = async (newRoles) => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await adminService.updateUserRoles(selectedUser.id, newRoles);
            setRoleModalVisible(false);
            Alert.alert('Thành công', 'Đã cập nhật quyền người dùng');
            refreshData();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật quyền');
        } finally {
            setActionLoading(false);
            setSelectedUser(null);
        }
    };

    // --- RENDER ITEM ---
    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {/* Header Card: Avatar + Name */}
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    {item.avatarUrl ? (
                        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                    ) : (
                        <FontAwesome5 name="user-circle" size={40} color="#D1D5DB" />
                    )}
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    <View style={styles.badgesRow}>
                        <UserStatusBadge user={item} />
                        {item.roles.includes('ROLE_ADMIN') && (
                            <View style={styles.adminBadge}>
                                <Text style={styles.adminBadgeText}>ADMIN</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Actions Bar */}
            <View style={styles.actionBar}>
                {/* Button: Phân quyền */}
                <TouchableOpacity style={styles.actionBtn} onPress={() => openRoleModal(item)}>
                    <FontAwesome5 name="user-shield" size={16} color="#2563EB" />
                    <Text style={[styles.actionText, { color: '#2563EB' }]}>Quyền</Text>
                </TouchableOpacity>

                {/* Button: Gửi mail (Chỉ hiện nếu chưa active) */}
                {!item.isEnabled && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleResendEmail(item)}>
                        <FontAwesome5 name="envelope" size={16} color="#6B7280" />
                        <Text style={[styles.actionText, { color: '#6B7280' }]}>Gửi Email</Text>
                    </TouchableOpacity>
                )}

                {/* Button: Lock/Unlock */}
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleLockPress(item)}>
                    <FontAwesome5 
                        name={item.accountNonLocked ? "lock" : "unlock"} 
                        size={16} 
                        color={item.accountNonLocked ? "#EF4444" : "#10B981"} 
                    />
                    <Text style={[styles.actionText, { color: item.accountNonLocked ? "#EF4444" : "#10B981" }]}>
                        {item.accountNonLocked ? 'Khóa' : 'Mở khóa'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return <View style={{ height: 20 }} />;
        return <View style={{ padding: 20 }}><ActivityIndicator color="#2563EB" /></View>;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="Quản trị viên" />
            <PageHeader 
                title="Quản lý người dùng" 
                subtitle={`Danh sách tài khoản hệ thống`} 
            />

            {/* Search Bar */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo tên hoặc email..."
                    value={keyword}
                    onChangeText={setKeyword}
                />
                {keyword.length > 0 && (
                    <TouchableOpacity onPress={() => setKeyword('')}>
                        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            {loading && !refreshing && users.length === 0 ? (
                <Loading variant="inline" text="Đang tải danh sách..." />
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <FontAwesome5 name="users-slash" size={40} color="#E5E7EB" />
                            <Text style={styles.emptyText}>Không tìm thấy người dùng nào</Text>
                        </View>
                    }
                />
            )}

            {/* Custom Modal for Roles */}
            <RoleSelectModal
                visible={roleModalVisible}
                onClose={() => { setRoleModalVisible(false); setSelectedUser(null); }}
                onConfirm={handleUpdateRoles}
                initialRoles={selectedUser?.roles}
                isLoading={actionLoading}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        margin: 16, paddingHorizontal: 12, height: 44, borderRadius: 8,
        borderWidth: 1, borderColor: '#E5E7EB'
    },
    searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
    listContent: { paddingHorizontal: 16, paddingBottom: 20 },
    
    // Card Styles
    card: {
        backgroundColor: '#FFF', borderRadius: 12, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 2, elevation: 2
    },
    cardHeader: { flexDirection: 'row', padding: 16 },
    avatarContainer: { marginRight: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6' },
    userInfo: { flex: 1, justifyContent: 'center' },
    username: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
    email: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
    badgesRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    adminBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#E9D5FF' },
    adminBadgeText: { fontSize: 10, color: '#7E22CE', fontWeight: '700' },
    
    divider: { height: 1, backgroundColor: '#F3F4F6' },
    
    actionBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
    actionText: { marginLeft: 6, fontSize: 13, fontWeight: '600' },
    
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText: { marginTop: 12, color: '#9CA3AF' }
});

export default AdminUsersScreen;