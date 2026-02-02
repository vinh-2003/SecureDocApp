import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Component hiển thị danh sách người được chia sẻ
 * Đồng bộ với logic trong ShareModal.jsx trên Web
 * 
 * @param {Object} owner - Thông tin chủ sở hữu
 * @param {Array} sharedWith - Danh sách người được chia sẻ
 * @param {string} currentUserId - ID user hiện tại
 * @param {Function} onRevokeClick - Callback khi click xóa quyền
 * @param {Function} onUpdatePermission - Callback khi cập nhật quyền
 */
const SharedUsersList = ({
    owner,
    sharedWith = [],
    currentUserId,
    onRevokeClick,
    onUpdatePermission
}) => {
    const [permissionModal, setPermissionModal] = useState({ visible: false, user: null });

    const PERMISSION_OPTIONS = [
        { value: 'VIEWER', label: 'Người xem', color: '#3B82F6', bgColor: '#DBEAFE' },
        { value: 'COMMENTER', label: 'Người nhận xét', color: '#14B8A6', bgColor: '#CCFBF1' },
        { value: 'EDITOR', label: 'Người chỉnh sửa', color: '#F97316', bgColor: '#FFEDD5' }
    ];

    const getPermissionLabel = (type) => {
        switch (type) {
            case 'INHERITED_OWNER': return 'Chủ sở hữu (Kế thừa)';
            case 'EDITOR': return 'Chỉnh sửa';
            case 'COMMENTER': return 'Nhận xét';
            case 'VIEWER':
            default: return 'Xem';
        }
    };

    const getPermissionStyle = (type) => {
        switch (type) {
            case 'INHERITED_OWNER':
                return { color: '#7C3AED', bgColor: '#EDE9FE' };
            case 'EDITOR':
                return { color: '#F97316', bgColor: '#FFEDD5' };
            case 'COMMENTER':
                return { color: '#14B8A6', bgColor: '#CCFBF1' };
            case 'VIEWER':
            default:
                return { color: '#3B82F6', bgColor: '#DBEAFE' };
        }
    };

    const isInheritedPermission = (type) => type === 'INHERITED_OWNER';

    const handlePermissionPress = (perm) => {
        if (!isInheritedPermission(perm.permissionType)) {
            setPermissionModal({ visible: true, user: perm });
        }
    };

    const handleSelectPermission = (newPermission) => {
        if (onUpdatePermission && permissionModal.user) {
            onUpdatePermission(permissionModal.user.user.email, newPermission);
        }
        setPermissionModal({ visible: false, user: null });
    };

    const renderUserAvatar = (user) => {
        if (user?.avatarUrl) {
            return (
                <Image 
                    source={{ uri: user.avatarUrl }} 
                    style={styles.avatar}
                />
            );
        }
        return (
            <View style={styles.avatarPlaceholder}>
                <FontAwesome5 name="user" size={16} color="#9CA3AF" />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Những người có quyền truy cập</Text>

            {/* Chủ sở hữu */}
            {owner && (
                <View style={styles.userItem}>
                    <View style={styles.userInfo}>
                        {renderUserAvatar(owner)}
                        <View style={styles.userTextContainer}>
                            <Text style={styles.userName} numberOfLines={1}>
                                {owner.name}
                                {owner.id === currentUserId && (
                                    <Text style={styles.youLabel}> (bạn)</Text>
                                )}
                            </Text>
                            <Text style={styles.userEmail} numberOfLines={1}>
                                {owner.email}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.ownerBadge}>
                        <Text style={styles.ownerBadgeText}>Chủ sở hữu</Text>
                    </View>
                </View>
            )}

            {/* Danh sách được chia sẻ */}
            {sharedWith?.map((perm, idx) => {
                const isInherited = isInheritedPermission(perm.permissionType);
                const isMe = perm.user?.id === currentUserId;
                const permStyle = getPermissionStyle(perm.permissionType);

                return (
                    <View key={idx} style={styles.userItem}>
                        <View style={styles.userInfo}>
                            {renderUserAvatar(perm.user)}
                            <View style={styles.userTextContainer}>
                                <Text style={styles.userName} numberOfLines={1}>
                                    {perm.user?.name}
                                    {isMe && <Text style={styles.youLabel}> (bạn)</Text>}
                                </Text>
                                <Text style={styles.userEmail} numberOfLines={1}>
                                    {perm.user?.email}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.actionContainer}>
                            {/* Nút xóa quyền */}
                            {!isInherited && (
                                <TouchableOpacity
                                    style={styles.revokeButton}
                                    onPress={() => onRevokeClick(perm.user)}
                                >
                                    <FontAwesome5 name="times" size={12} color="#EF4444" />
                                </TouchableOpacity>
                            )}

                            {/* Badge quyền */}
                            <TouchableOpacity
                                style={[
                                    styles.permissionBadge,
                                    { backgroundColor: permStyle.bgColor }
                                ]}
                                onPress={() => handlePermissionPress(perm)}
                                disabled={isInherited}
                            >
                                <Text style={[
                                    styles.permissionBadgeText,
                                    { color: permStyle.color }
                                ]}>
                                    {getPermissionLabel(perm.permissionType)}
                                </Text>
                                {!isInherited && (
                                    <FontAwesome5 
                                        name="caret-down" 
                                        size={10} 
                                        color={permStyle.color} 
                                        style={{ marginLeft: 4 }}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}

            {/* Modal chọn quyền */}
            <Modal
                visible={permissionModal.visible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPermissionModal({ visible: false, user: null })}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setPermissionModal({ visible: false, user: null })}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chọn quyền truy cập</Text>
                        
                        {PERMISSION_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.permissionOption,
                                    permissionModal.user?.permissionType === option.value && 
                                        { backgroundColor: option.bgColor }
                                ]}
                                onPress={() => handleSelectPermission(option.value)}
                            >
                                <View style={[
                                    styles.permissionDot,
                                    { backgroundColor: option.color }
                                ]} />
                                <Text style={styles.permissionOptionText}>
                                    {option.label}
                                </Text>
                                {permissionModal.user?.permissionType === option.value && (
                                    <FontAwesome5 name="check" size={14} color={option.color} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 4
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    userTextContainer: {
        flex: 1
    },
    userName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937'
    },
    youLabel: {
        color: '#9CA3AF',
        fontWeight: '400'
    },
    userEmail: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },
    actionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    revokeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center'
    },
    ownerBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 20
    },
    ownerBadgeText: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic'
    },
    permissionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },
    permissionBadgeText: {
        fontSize: 12,
        fontWeight: '600'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 320
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
        textAlign: 'center'
    },
    permissionOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 10,
        marginBottom: 8
    },
    permissionDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12
    },
    permissionOptionText: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937'
    }
});

export default SharedUsersList;