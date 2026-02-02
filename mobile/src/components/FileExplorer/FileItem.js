import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { formatBytes, formatDate, formatRelativeTime } from '../../utils/format';
import useFileIcon from '../../hooks/useFileIcon';

const FileItem = ({
    item,
    onPress,
    onLongPress,
    onMenuPress,
    isSelected,
    showOwner = false,
    showAccessedAt = false,
    showDeletedAt = false
}) => {
    const { getFileIcon } = useFileIcon();
    const isFolder = item.type === 'FOLDER';

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isSelected && styles.selectedContainer,
                item.isInTrash && styles.trashContainer
            ]}
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={300}
            activeOpacity={0.7}
        >
            {/* 1. Icon bên trái */}
            <View style={styles.iconContainer}>
                {getFileIcon(item, 24)}
            </View>

            {/* 2. Thông tin chính (Tên + Metadata) */}
            <View style={styles.infoContainer}>
                <Text
                    style={[
                        styles.name,
                        isSelected && styles.selectedText,
                        item.isInTrash && styles.trashText
                    ]}
                    numberOfLines={1}
                >
                    {item.name}
                </Text>

                <View style={styles.metaRow}>
                    {/* Owner info (cho Shared) */}
                    {showOwner && (item.ownerName || item.ownerEmail) && (
                        <>
                            <View style={styles.ownerBadge}>
                                {item.ownerAvatar ? (
                                    <Image
                                        source={{ uri: item.ownerAvatar }}
                                        style={styles.ownerAvatar}
                                    />
                                ) : (
                                    <FontAwesome5 name="user" size={8} color="#6B7280" />
                                )}
                                <Text style={styles.ownerText} numberOfLines={1}>
                                    {item.ownerName || item.ownerEmail}
                                </Text>
                            </View>
                            <Text style={styles.dot}>•</Text>
                        </>
                    )}

                    {/* Accessed time badge (cho Recent) */}
                    {showAccessedAt && item.accessedAt && (
                        <>
                            <View style={styles.accessedBadge}>
                                <FontAwesome5 name="clock" size={10} color="#059669" />
                                <Text style={styles.accessedText}>
                                    {formatRelativeTime(item.accessedAt)}
                                </Text>
                            </View>
                            <Text style={styles.dot}>•</Text>
                        </>
                    )}

                    {/* Deleted time badge (cho Trash) */}
                    {showDeletedAt && item.deletedAt && (
                        <>
                            <View style={styles.deletedBadge}>
                                <FontAwesome5 name="trash" size={10} color="#DC2626" />
                                <Text style={styles.deletedText}>
                                    {formatRelativeTime(item.deletedAt)}
                                </Text>
                            </View>
                            <Text style={styles.dot}>•</Text>
                        </>
                    )}

                    {/* Default: Date + Size (không hiển thị nếu đã có badge khác) */}
                    {!showAccessedAt && !showDeletedAt && (
                        <>
                            <Text style={styles.metaText}>
                                {formatDate(item.updatedAt)}
                            </Text>
                            <Text style={styles.dot}>•</Text>
                        </>
                    )}

                    <Text style={styles.metaText}>
                        {isFolder ? 'Thư mục' : formatBytes(item.size)}
                    </Text>
                </View>
            </View>

            {/* 3. Nút Menu (3 chấm) */}
            {!isSelected && onMenuPress && (
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={onMenuPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <FontAwesome5 name="ellipsis-v" size={14} color="#9CA3AF" />
                </TouchableOpacity>
            )}

            {/* 4. Checkbox (Icon check) */}
            {isSelected && (
                <View style={styles.checkIcon}>
                    <FontAwesome5 name="check-circle" size={20} color="#3B82F6" solid />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    selectedContainer: {
        backgroundColor: '#EFF6FF',
    },
    trashContainer: {
        backgroundColor: '#FFFBEB',
    },
    iconContainer: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 4,
    },
    selectedText: {
        color: '#2563EB',
        fontWeight: '600',
    },
    trashText: {
        color: '#92400E',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
    },
    dot: {
        fontSize: 12,
        color: '#9CA3AF',
        marginHorizontal: 6,
    },
    ownerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        maxWidth: 120,
    },
    ownerAvatar: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    ownerText: {
        fontSize: 12,
        color: '#6B7280',
        maxWidth: 100,
    },
    accessedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    accessedText: {
        fontSize: 11,
        color: '#059669',
        fontWeight: '500',
    },
    deletedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    deletedText: {
        fontSize: 11,
        color: '#DC2626',
        fontWeight: '500',
    },
    menuButton: {
        padding: 10,
        marginLeft: 8,
    },
    checkIcon: {
        paddingLeft: 10,
    }
});

export default FileItem;