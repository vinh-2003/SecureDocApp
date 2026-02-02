import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Dimensions,
    Pressable
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ShareModal = ({
    isOpen,
    onClose,
    data,
    loading = false,
    currentUserId,
    emailInput = '',
    onEmailChange,
    permissionInput = 'VIEWER',
    onPermissionChange,
    onAddUser,
    onRevokeClick,
    onUpdatePermission,
    onChangePublicAccess,
    onCopyLink
}) => {
    const [showPermissionPicker, setShowPermissionPicker] = useState(false);
    const [showUserPermissionPicker, setShowUserPermissionPicker] = useState(null);
    const [showPublicAccessPicker, setShowPublicAccessPicker] = useState(false);

    if (!isOpen) return null;

    // =========================================================================
    // HELPERS
    // =========================================================================
    
    const PERMISSION_OPTIONS = [
        { value: 'VIEWER', label: 'Người xem', color: '#3B82F6', bgColor: '#DBEAFE' },
        { value: 'COMMENTER', label: 'Người nhận xét', color: '#14B8A6', bgColor: '#CCFBF1' },
        { value: 'EDITOR', label: 'Người chỉnh sửa', color: '#F97316', bgColor: '#FFEDD5' }
    ];

    const PUBLIC_ACCESS_OPTIONS = [
        {
            value: 'PRIVATE',
            label: 'Hạn chế',
            description: 'Chỉ những người được thêm mới có thể mở.',
            icon: 'lock',
            iconColor: '#6B7280'
        },
        {
            value: 'PUBLIC_VIEW',
            label: 'Bất kỳ ai có liên kết (Người xem)',
            description: 'Bất kỳ ai có liên kết đều có thể xem.',
            icon: 'eye',
            iconColor: '#3B82F6'
        },
        {
            value: 'PUBLIC_EDIT',
            label: 'Bất kỳ ai có liên kết (Người chỉnh sửa)',
            description: 'Bất kỳ ai có liên kết đều có thể chỉnh sửa.',
            icon: 'edit',
            iconColor: '#10B981'
        }
    ];

    const getPermissionLabel = (type) => {
        switch (type) {
            case 'INHERITED_OWNER': return 'Kế thừa';
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

    const getSelectedPermissionLabel = () => {
        const option = PERMISSION_OPTIONS.find(o => o.value === permissionInput);
        return option?.label || 'Người xem';
    };

    const getPublicAccessInfo = () => {
        const option = PUBLIC_ACCESS_OPTIONS.find(o => o.value === data?.publicAccess);
        return option || PUBLIC_ACCESS_OPTIONS[0];
    };

    const handleAddUserPress = () => {
        Keyboard.dismiss();
        if (onAddUser) onAddUser();
    };

    const renderAvatar = (user, size = 40) => {
        if (user?.avatarUrl) {
            return (
                <Image
                    source={{ uri: user.avatarUrl }}
                    style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
                />
            );
        }
        return (
            <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
                <FontAwesome5 name="user" size={size * 0.4} color="#9CA3AF" />
            </View>
        );
    };

    const sharedCount = (data?.sharedWith?.length || 0) + (data?.owner ? 1 : 0);

    // =========================================================================
    // RENDER CONTENT
    // =========================================================================

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            );
        }

        if (!data) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Không có dữ liệu.</Text>
                </View>
            );
        }

        return (
            <>
                {/* Danh sách người có quyền truy cập */}
                <View style={styles.accessListSection}>
                    <Text style={styles.sectionTitle}>
                        Những người có quyền truy cập
                        {sharedCount > 0 && (
                            <Text style={styles.countBadge}> ({sharedCount})</Text>
                        )}
                    </Text>

                    {/* Chủ sở hữu */}
                    {data.owner && (
                        <View style={styles.userItem}>
                            <View style={styles.userInfo}>
                                {renderAvatar(data.owner)}
                                <View style={styles.userTextContainer}>
                                    <Text style={styles.userName} numberOfLines={1}>
                                        {data.owner.name || data.owner.fullName || 'Không tên'}
                                        {data.owner.id === currentUserId && (
                                            <Text style={styles.youLabel}> (bạn)</Text>
                                        )}
                                    </Text>
                                    <Text style={styles.userEmail} numberOfLines={1}>
                                        {data.owner.email}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.ownerBadge}>
                                <Text style={styles.ownerBadgeText}>Chủ sở hữu</Text>
                            </View>
                        </View>
                    )}

                    {/* Danh sách được chia sẻ */}
                    {data.sharedWith?.map((perm, idx) => {
                        const isInherited = isInheritedPermission(perm.permissionType);
                        const isMe = perm.user?.id === currentUserId;
                        const permStyle = getPermissionStyle(perm.permissionType);

                        return (
                            <View key={idx} style={styles.userItem}>
                                <View style={styles.userInfo}>
                                    {renderAvatar(perm.user)}
                                    <View style={styles.userTextContainer}>
                                        <Text style={styles.userName} numberOfLines={1}>
                                            {perm.user?.name || perm.user?.fullName || 'Không tên'}
                                            {isMe && <Text style={styles.youLabel}> (bạn)</Text>}
                                        </Text>
                                        <Text style={styles.userEmail} numberOfLines={1}>
                                            {perm.user?.email}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.userActions}>
                                    {!isInherited && (
                                        <TouchableOpacity
                                            style={styles.revokeButton}
                                            onPress={() => onRevokeClick(perm.user)}
                                        >
                                            <FontAwesome5 name="times" size={12} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={[
                                            styles.permissionBadge,
                                            { backgroundColor: permStyle.bgColor }
                                        ]}
                                        onPress={() => !isInherited && setShowUserPermissionPicker(perm)}
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
                </View>

                {/* Quyền truy cập chung */}
                <View style={styles.publicAccessSection}>
                    <Text style={styles.sectionTitle}>Quyền truy cập chung</Text>
                    
                    <TouchableOpacity
                        style={styles.publicAccessButton}
                        onPress={() => setShowPublicAccessPicker(true)}
                    >
                        <View style={[
                            styles.publicAccessIcon,
                            { backgroundColor: data?.publicAccess === 'PRIVATE' ? '#F3F4F6' : '#D1FAE5' }
                        ]}>
                            <FontAwesome5
                                name={getPublicAccessInfo().icon}
                                size={14}
                                color={getPublicAccessInfo().iconColor}
                            />
                        </View>
                        <View style={styles.publicAccessTextContainer}>
                            <Text style={styles.publicAccessLabel}>
                                {getPublicAccessInfo().label}
                            </Text>
                            <Text style={styles.publicAccessDescription} numberOfLines={2}>
                                {getPublicAccessInfo().description}
                            </Text>
                        </View>
                        <FontAwesome5 name="chevron-down" size={12} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </>
        );
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <Modal
            visible={isOpen}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardAvoid}
            >
                <View style={styles.overlay}>
                    {/* Backdrop - nhấn để đóng */}
                    <Pressable style={styles.backdrop} onPress={onClose} />

                    {/* Modal Content */}
                    <View style={styles.modalContainer}>
                        {/* Handle bar */}
                        <View style={styles.handleBar}>
                            <View style={styles.handle} />
                        </View>

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <View style={styles.headerIcon}>
                                    <FontAwesome5 name="user-plus" size={16} color="#2563EB" />
                                </View>
                                <Text style={styles.headerTitle} numberOfLines={1}>
                                    Chia sẻ "{data?.name}"
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <FontAwesome5 name="times" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Form thêm người - Cố định */}
                        {!loading && data && (
                            <View style={styles.addUserSection}>
                                <TextInput
                                    style={styles.emailInput}
                                    placeholder="Nhập email người nhận..."
                                    placeholderTextColor="#9CA3AF"
                                    value={emailInput}
                                    onChangeText={onEmailChange}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="done"
                                    onSubmitEditing={handleAddUserPress}
                                />

                                <View style={styles.addUserRow}>
                                    <TouchableOpacity
                                        style={styles.permissionButton}
                                        onPress={() => {
                                            Keyboard.dismiss();
                                            setShowPermissionPicker(true);
                                        }}
                                    >
                                        <Text style={styles.permissionButtonText}>
                                            {getSelectedPermissionLabel()}
                                        </Text>
                                        <FontAwesome5 name="caret-down" size={12} color="#6B7280" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.sendButton}
                                        onPress={handleAddUserPress}
                                    >
                                        <FontAwesome5 name="paper-plane" size={14} color="white" />
                                        <Text style={styles.sendButtonText}>Gửi</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Scrollable Content */}
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={true}
                            bounces={true}
                            overScrollMode="always"
                            keyboardShouldPersistTaps="handled"
                        >
                            {renderContent()}
                        </ScrollView>

                        {/* Footer - Cố định */}
                        {!loading && data && (
                            <View style={styles.footer}>
                                <TouchableOpacity style={styles.copyLinkButton} onPress={onCopyLink}>
                                    <FontAwesome5 name="link" size={14} color="#2563EB" />
                                    <Text style={styles.copyLinkText}>Sao chép liên kết</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                                    <Text style={styles.doneButtonText}>Xong</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* ================================================================= */}
            {/* PICKER MODALS */}
            {/* ================================================================= */}

            {/* Permission Picker */}
            <Modal
                visible={showPermissionPicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPermissionPicker(false)}
            >
                <View style={styles.pickerOverlay}>
                    <Pressable style={styles.pickerBackdrop} onPress={() => setShowPermissionPicker(false)} />
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>Chọn quyền</Text>
                        {PERMISSION_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.pickerOption,
                                    permissionInput === option.value && { backgroundColor: option.bgColor }
                                ]}
                                onPress={() => {
                                    onPermissionChange(option.value);
                                    setShowPermissionPicker(false);
                                }}
                            >
                                <View style={[styles.pickerDot, { backgroundColor: option.color }]} />
                                <Text style={styles.pickerOptionText}>{option.label}</Text>
                                {permissionInput === option.value && (
                                    <FontAwesome5 name="check" size={14} color={option.color} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* User Permission Picker */}
            <Modal
                visible={showUserPermissionPicker !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowUserPermissionPicker(null)}
            >
                <View style={styles.pickerOverlay}>
                    <Pressable style={styles.pickerBackdrop} onPress={() => setShowUserPermissionPicker(null)} />
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>Thay đổi quyền</Text>
                        <Text style={styles.pickerSubtitle}>
                            {showUserPermissionPicker?.user?.email}
                        </Text>
                        {PERMISSION_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.pickerOption,
                                    showUserPermissionPicker?.permissionType === option.value && 
                                        { backgroundColor: option.bgColor }
                                ]}
                                onPress={() => {
                                    if (showUserPermissionPicker?.user?.email) {
                                        onUpdatePermission(showUserPermissionPicker.user.email, option.value);
                                    }
                                    setShowUserPermissionPicker(null);
                                }}
                            >
                                <View style={[styles.pickerDot, { backgroundColor: option.color }]} />
                                <Text style={styles.pickerOptionText}>{option.label}</Text>
                                {showUserPermissionPicker?.permissionType === option.value && (
                                    <FontAwesome5 name="check" size={14} color={option.color} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* Public Access Picker */}
            <Modal
                visible={showPublicAccessPicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPublicAccessPicker(false)}
            >
                <View style={styles.pickerOverlay}>
                    <Pressable style={styles.pickerBackdrop} onPress={() => setShowPublicAccessPicker(false)} />
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>Quyền truy cập chung</Text>
                        {PUBLIC_ACCESS_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.publicAccessOption,
                                    data?.publicAccess === option.value && styles.publicAccessOptionActive
                                ]}
                                onPress={() => {
                                    onChangePublicAccess(option.value);
                                    setShowPublicAccessPicker(false);
                                }}
                            >
                                <View style={[
                                    styles.publicAccessOptionIcon,
                                    { backgroundColor: option.value === 'PRIVATE' ? '#F3F4F6' : '#D1FAE5' }
                                ]}>
                                    <FontAwesome5
                                        name={option.icon}
                                        size={14}
                                        color={option.iconColor}
                                    />
                                </View>
                                <View style={styles.publicAccessOptionTextContainer}>
                                    <Text style={styles.publicAccessOptionLabel}>{option.label}</Text>
                                    <Text style={styles.publicAccessOptionDescription}>
                                        {option.description}
                                    </Text>
                                </View>
                                {data?.publicAccess === option.value && (
                                    <FontAwesome5 name="check" size={14} color="#2563EB" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </Modal>
    );
};

const styles = StyleSheet.create({
    keyboardAvoid: {
        flex: 1
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.9,
        minHeight: SCREEN_HEIGHT * 0.4
    },
    handleBar: {
        alignItems: 'center',
        paddingVertical: 12
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1
    },
    closeButton: {
        padding: 8
    },
    loadingContainer: {
        paddingVertical: 60,
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: '#6B7280',
        fontSize: 14
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center'
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 14
    },
    addUserSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    emailInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#F9FAFB',
        marginBottom: 12
    },
    addUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    permissionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#F3F4F6',
        borderRadius: 12
    },
    permissionButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151'
    },
    sendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#2563EB',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12
    },
    sendButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15
    },
    scrollView: {
        maxHeight: SCREEN_HEIGHT * 0.45
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20
    },
    accessListSection: {
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 14
    },
    countBadge: {
        fontSize: 14,
        fontWeight: '400',
        color: '#6B7280'
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12
    },
    avatar: {
        marginRight: 12
    },
    avatarPlaceholder: {
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    userTextContainer: {
        flex: 1
    },
    userName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1F2937'
    },
    youLabel: {
        color: '#9CA3AF',
        fontWeight: '400'
    },
    userEmail: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2
    },
    userActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    revokeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center'
    },
    ownerBadge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20
    },
    ownerBadgeText: {
        fontSize: 13,
        color: '#6B7280',
        fontStyle: 'italic'
    },
    permissionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20
    },
    permissionBadgeText: {
        fontSize: 13,
        fontWeight: '600'
    },
    publicAccessSection: {
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    publicAccessButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    publicAccessIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14
    },
    publicAccessTextContainer: {
        flex: 1
    },
    publicAccessLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1F2937'
    },
    publicAccessDescription: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 3
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: 'white'
    },
    copyLinkButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: '#2563EB',
        borderRadius: 12,
        backgroundColor: 'white'
    },
    copyLinkText: {
        color: '#2563EB',
        fontWeight: '600',
        fontSize: 15
    },
    doneButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: '#2563EB',
        borderRadius: 12
    },
    doneButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15
    },

    // Picker Modals
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    pickerBackdrop: {
        ...StyleSheet.absoluteFillObject
    },
    pickerContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 360
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center'
    },
    pickerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
        textAlign: 'center'
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8
    },
    pickerDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 14
    },
    pickerOptionText: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937'
    },
    publicAccessOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        marginBottom: 10
    },
    publicAccessOptionActive: {
        backgroundColor: '#EFF6FF'
    },
    publicAccessOptionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14
    },
    publicAccessOptionTextContainer: {
        flex: 1
    },
    publicAccessOptionLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1F2937'
    },
    publicAccessOptionDescription: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 3
    }
});

export default ShareModal;