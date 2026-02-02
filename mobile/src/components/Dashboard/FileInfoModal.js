import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    Modal,
    Pressable,
    Dimensions,
    Platform
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { formatBytes, formatDate } from '../../utils/format';
import useFileIcon from '../../hooks/useFileIcon';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Modal hiển thị thông tin chi tiết file/folder
 */
const FileInfoModal = ({
    isOpen,
    onClose,
    file,
    data,
    loading = false,
    currentUserId
}) => {
    const fileData = data || file;
    const { getFileIcon } = useFileIcon();

    if (!isOpen) return null;

    // =========================================================================
    // HELPERS
    // =========================================================================

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

    const renderAvatar = (user, size = 28) => {
        if (user?.avatarUrl) {
            return (
                <Image
                    source={{ uri: user.avatarUrl }}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                />
            );
        }
        return (
            <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
                <FontAwesome5 name="user" size={size * 0.45} color="#9CA3AF" />
            </View>
        );
    };

    const getPublicAccessInfo = (publicAccess) => {
        switch (publicAccess) {
            case 'PUBLIC_VIEW':
                return {
                    label: 'Công khai (Xem)',
                    description: 'Bất kỳ ai có liên kết đều có thể xem.',
                    icon: 'globe-asia',
                    color: '#10B981',
                    bgColor: '#D1FAE5'
                };
            case 'PUBLIC_EDIT':
                return {
                    label: 'Công khai (Chỉnh sửa)',
                    description: 'Bất kỳ ai có liên kết đều có thể chỉnh sửa.',
                    icon: 'globe-asia',
                    color: '#3B82F6',
                    bgColor: '#DBEAFE'
                };
            case 'PRIVATE':
            default:
                return {
                    label: 'Riêng tư',
                    description: 'Chỉ những người được thêm mới có thể mở.',
                    icon: 'lock',
                    color: '#6B7280',
                    bgColor: '#F3F4F6'
                };
        }
    };

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

        if (!fileData) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Không có dữ liệu.</Text>
                </View>
            );
        }

        const accessInfo = getPublicAccessInfo(fileData.publicAccess);

        return (
            <>
                {/* 1. File Header: Icon + Tên */}
                <View style={styles.fileHeader}>
                    <View style={styles.fileIconContainer}>
                        {getFileIcon(fileData, 36)}
                    </View>
                    <View style={styles.fileHeaderText}>
                        <Text style={styles.fileName} numberOfLines={2}>
                            {fileData.name}
                        </Text>
                        <Text style={styles.fileMimeType}>
                            {fileData.mimeType || 'Thư mục'}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* 2. Thông tin chung */}
                <View style={styles.section}>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Loại</Text>
                            <Text style={styles.infoValue}>
                                {fileData.extension 
                                    ? `Tệp ${fileData.extension.toUpperCase()}` 
                                    : 'Thư mục'}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Kích thước</Text>
                            <Text style={styles.infoValue}>
                                {fileData.type === 'FOLDER' ? '--' : formatBytes(fileData.size)}
                            </Text>
                        </View>
                    </View>

                    {/* Vị trí */}
                    {fileData.locationPath && (
                        <View style={styles.locationContainer}>
                            <Text style={styles.infoLabel}>Vị trí</Text>
                            <View style={styles.locationBox}>
                                <FontAwesome5 name="folder" size={12} color="#6B7280" />
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {fileData.locationPath}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Ngày tạo</Text>
                            <Text style={styles.infoValue}>
                                {formatDate(fileData.createdAt)}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Cập nhật lần cuối</Text>
                            <Text style={styles.infoValue}>
                                {formatDate(fileData.updatedAt)}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* 3. Quyền & Sở hữu */}
                <View style={styles.section}>
                    {/* Chủ sở hữu */}
                    <View style={styles.ownerRow}>
                        <Text style={styles.infoLabel}>Chủ sở hữu</Text>
                        <View style={styles.userBadge}>
                            {renderAvatar(fileData.owner)}
                            <Text style={styles.userBadgeText}>
                                {fileData.owner?.name || fileData.owner?.email || 'Không xác định'}
                                {fileData.owner?.id === currentUserId && (
                                    <Text style={styles.youLabel}> (bạn)</Text>
                                )}
                            </Text>
                        </View>
                    </View>

                    {/* Người sửa cuối */}
                    {fileData.lastModifiedBy && (
                        <View style={styles.ownerRow}>
                            <Text style={styles.infoLabel}>Sửa lần cuối bởi</Text>
                            <View style={styles.userBadge}>
                                {renderAvatar(fileData.lastModifiedBy)}
                                <Text style={styles.userBadgeText}>
                                    {fileData.lastModifiedBy?.name || fileData.lastModifiedBy?.email}
                                    {fileData.lastModifiedBy?.id === currentUserId && (
                                        <Text style={styles.youLabel}> (bạn)</Text>
                                    )}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Quyền truy cập chung */}
                    <View style={styles.accessSection}>
                        <Text style={styles.infoLabel}>Quyền truy cập</Text>
                        
                        <View style={[styles.publicAccessBadge, { backgroundColor: accessInfo.bgColor }]}>
                            <View style={styles.publicAccessIcon}>
                                <FontAwesome5 name={accessInfo.icon} size={14} color={accessInfo.color} />
                            </View>
                            <View style={styles.publicAccessTextContainer}>
                                <Text style={[styles.publicAccessLabel, { color: accessInfo.color }]}>
                                    {accessInfo.label}
                                </Text>
                                <Text style={styles.publicAccessDescription}>
                                    {accessInfo.description}
                                </Text>
                            </View>
                        </View>

                        {/* Shared Users List */}
                        {fileData.sharedWith && fileData.sharedWith.length > 0 ? (
                            <View style={styles.sharedUsersSection}>
                                <Text style={styles.sharedUsersTitle}>
                                    Đã chia sẻ ({fileData.sharedWith.length})
                                </Text>
                                {fileData.sharedWith.map((perm, idx) => {
                                    const permStyle = getPermissionStyle(perm.permissionType);
                                    return (
                                        <View key={idx} style={styles.sharedUserItem}>
                                            <View style={styles.sharedUserInfo}>
                                                {renderAvatar(perm.user, 36)}
                                                <View style={styles.sharedUserText}>
                                                    <Text style={styles.sharedUserName} numberOfLines={1}>
                                                        {perm.user?.name || perm.user?.fullName || 'Không tên'}
                                                        {perm.user?.id === currentUserId && (
                                                            <Text style={styles.youLabel}> (bạn)</Text>
                                                        )}
                                                    </Text>
                                                    <Text style={styles.sharedUserEmail} numberOfLines={1}>
                                                        {perm.user?.email}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={[styles.permissionBadge, { backgroundColor: permStyle.bgColor }]}>
                                                <Text style={[styles.permissionBadgeText, { color: permStyle.color }]}>
                                                    {getPermissionLabel(perm.permissionType)}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <Text style={styles.noShareText}>Chưa chia sẻ với ai.</Text>
                        )}
                    </View>
                </View>

                {/* 4. Mô tả */}
                {fileData.description && (
                    <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionTitle}>Mô tả</Text>
                        <Text style={styles.descriptionText}>{fileData.description}</Text>
                    </View>
                )}
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
                        <Text style={styles.headerTitle}>Thông tin chi tiết</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <FontAwesome5 name="times" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Content */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={true}
                        bounces={true}
                        overScrollMode="always"
                    >
                        {renderContent()}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeBtnText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937'
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
    scrollView: {
        maxHeight: SCREEN_HEIGHT * 0.6
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24
    },

    // File Header
    fileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14
    },
    fileIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center'
    },
    fileHeaderText: {
        flex: 1
    },
    fileName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4
    },
    fileMimeType: {
        fontSize: 13,
        color: '#6B7280'
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16
    },

    // Section
    section: {
        marginBottom: 4
    },
    infoGrid: {
        flexDirection: 'row',
        marginBottom: 12
    },
    infoItem: {
        flex: 1
    },
    infoLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937'
    },

    // Location
    locationContainer: {
        marginBottom: 12
    },
    locationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    locationText: {
        flex: 1,
        fontSize: 13,
        color: '#374151'
    },

    // Owner Row
    ownerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    userBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    userBadgeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937'
    },
    youLabel: {
        color: '#9CA3AF',
        fontWeight: '400'
    },
    avatarPlaceholder: {
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center'
    },

    // Access Section
    accessSection: {
        marginTop: 8
    },
    publicAccessBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        marginTop: 8
    },
    publicAccessIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    publicAccessTextContainer: {
        flex: 1
    },
    publicAccessLabel: {
        fontSize: 14,
        fontWeight: '600'
    },
    publicAccessDescription: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },

    // Shared Users
    sharedUsersSection: {
        marginTop: 16
    },
    sharedUsersTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 10
    },
    sharedUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        marginBottom: 8
    },
    sharedUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10
    },
    sharedUserText: {
        marginLeft: 10,
        flex: 1
    },
    sharedUserName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937'
    },
    sharedUserEmail: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 1
    },
    permissionBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },
    permissionBadgeText: {
        fontSize: 12,
        fontWeight: '600'
    },
    noShareText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginTop: 8
    },

    // Description
    descriptionSection: {
        backgroundColor: '#FFFBEB',
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FEF3C7',
        marginTop: 16
    },
    descriptionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#B45309',
        marginBottom: 6
    },
    descriptionText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20
    },

    // Footer
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#F9FAFB'
    },
    closeBtn: {
        backgroundColor: '#2563EB',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center'
    },
    closeBtnText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15
    }
});

export default FileInfoModal;