import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { formatBytes, formatDate } from '../../utils/format'; // Đảm bảo bạn đã có file utils
import useFileIcon from '../../hooks/useFileIcon';

const FileItem = ({
    item,
    onPress,
    onLongPress,
    onMenuPress,
    isSelected
}) => {
    const { getFileIcon } = useFileIcon();
    const isFolder = item.type === 'FOLDER';

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isSelected && styles.selectedContainer // Đổi màu nền khi được chọn
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
                    style={[styles.name, isSelected && styles.selectedText]}
                    numberOfLines={1}
                >
                    {item.name}
                </Text>

                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                        {formatDate(item.updatedAt)}
                    </Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.metaText}>
                        {isFolder ? 'Thư mục' : formatBytes(item.size)}
                    </Text>
                </View>
            </View>

            {/* 3. Nút Menu (3 chấm) - Chỉ hiện khi KHÔNG trong chế độ chọn */}
            {!isSelected && onMenuPress && (
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={onMenuPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Tăng vùng bấm
                >
                    <FontAwesome5 name="ellipsis-v" size={14} color="#9CA3AF" />
                </TouchableOpacity>
            )}

            {/* 4. Checkbox ảo (Icon check) - Chỉ hiện khi ĐANG chọn */}
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
        backgroundColor: '#EFF6FF', // blue-50
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
        color: '#1F2937', // gray-800
        marginBottom: 4,
    },
    selectedText: {
        color: '#2563EB', // blue-600
        fontWeight: '600',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280', // gray-500
    },
    dot: {
        fontSize: 12,
        color: '#9CA3AF',
        marginHorizontal: 6,
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