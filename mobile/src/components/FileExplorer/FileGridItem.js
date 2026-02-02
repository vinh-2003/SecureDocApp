import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import useFileIcon from '../../hooks/useFileIcon';
import { formatBytes, formatRelativeTime } from '../../utils/format';
import { getAvatarUrlFromAvatarUrl } from '../../utils/urlHelper';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

const FileGridItem = ({
    item,
    onPress,
    onLongPress,
    onMenuPress,
    isSelected = false,
    showOwner = false,
    showAccessedAt = false,
    showDeletedAt = false
}) => {
    const { getFileIcon, isProcessing, isFailed } = useFileIcon();
    const isFolder = item.type === 'FOLDER';

    return (
        <TouchableOpacity
            style={[
                styles.card,
                isSelected && styles.selectedCard,
                item.isInTrash && styles.trashCard
            ]}
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={300}
            activeOpacity={0.7}
        >
            {/* Checkbox góc trái */}
            {isSelected && (
                <View style={styles.checkbox}>
                    <FontAwesome5 name="check-circle" size={18} color="#2563EB" solid />
                </View>
            )}

            {/* Nút 3 chấm góc phải */}
            {!isSelected && onMenuPress && (
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={onMenuPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <FontAwesome5 name="ellipsis-v" size={12} color="#9CA3AF" />
                </TouchableOpacity>
            )}

            {/* Icon */}
            <View style={styles.iconContainer}>
                {getFileIcon(item, 40)}
            </View>

            {/* Tên file */}
            <Text
                style={[
                    styles.name,
                    isSelected && styles.selectedName,
                    item.isInTrash && styles.trashName
                ]}
                numberOfLines={1}
            >
                {item.name}
            </Text>

            {/* Thông tin phụ */}
            <Text style={styles.size}>
                {isProcessing(item)
                    ? 'Đang xử lý...'
                    : isFailed(item)
                        ? 'Lỗi'
                        : isFolder
                            ? 'Thư mục'
                            : formatBytes(item.size)
                }
            </Text>

            {/* Accessed time badge (cho Recent) */}
            {showAccessedAt && item.accessedAt && (
                <View style={styles.accessedBadge}>
                    <FontAwesome5 name="clock" size={10} color="#059669" />
                    <Text style={styles.accessedText}>
                        {formatRelativeTime(item.accessedAt)}
                    </Text>
                </View>
            )}

            {/* Deleted time badge (cho Trash) */}
            {showDeletedAt && item.deletedAt && (
                <View style={styles.deletedBadge}>
                    <FontAwesome5 name="trash" size={10} color="#DC2626" />
                    <Text style={styles.deletedText}>
                        {formatRelativeTime(item.deletedAt)}
                    </Text>
                </View>
            )}

            {/* Owner info (cho Shared) */}
            {showOwner && (item.ownerName || item.ownerEmail) && !showAccessedAt && !showDeletedAt && (
                <View style={styles.ownerRow}>
                    {item.ownerAvatar ? (
                        <Image
                            source={{ uri: item.ownerAvatar }}
                            style={styles.ownerAvatar}
                        />
                    ) : (
                        <FontAwesome5 name="user-circle" size={14} color="#9CA3AF" />
                    )}
                    <Text style={styles.ownerText} numberOfLines={1}>
                        {item.ownerName || item.ownerEmail}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: ITEM_WIDTH,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        margin: 6,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        position: 'relative'
    },
    selectedCard: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
        borderWidth: 2
    },
    trashCard: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FCD34D'
    },
    checkbox: {
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 10,
        backgroundColor: 'white',
        borderRadius: 10
    },
    menuButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        padding: 6,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12
    },
    iconContainer: {
        marginTop: 8,
        marginBottom: 10,
        height: 50,
        justifyContent: 'center'
    },
    name: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 2,
        textAlign: 'center',
        width: '100%'
    },
    selectedName: {
        color: '#2563EB',
        fontWeight: '600'
    },
    trashName: {
        color: '#92400E'
    },
    size: {
        fontSize: 11,
        color: '#9CA3AF'
    },
    accessedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8
    },
    accessedText: {
        fontSize: 10,
        color: '#059669',
        fontWeight: '500'
    },
    deletedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8
    },
    deletedText: {
        fontSize: 10,
        color: '#DC2626',
        fontWeight: '500'
    },
    ownerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        width: '100%',
        justifyContent: 'center'
    },
    ownerAvatar: {
        width: 16,
        height: 16,
        borderRadius: 8
    },
    ownerText: {
        fontSize: 10,
        color: '#6B7280',
        maxWidth: 80
    }
});

export default FileGridItem;