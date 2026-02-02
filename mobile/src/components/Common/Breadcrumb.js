import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Các loại root breadcrumb
 */
export const BREADCRUMB_ROOTS = {
    MY_ROOT: 'MY_ROOT',
    SHARED_ROOT: 'SHARED_ROOT',
    TRASH_ROOT: 'TRASH_ROOT',
    RECENT_ROOT: 'RECENT_ROOT'
};

/**
 * Config cho các loại root
 */
const ROOT_CONFIG = {
    [BREADCRUMB_ROOTS.MY_ROOT]: {
        label: 'Tài liệu của tôi',
        icon: 'folder',
        color: '#2563EB',
        bgColor: '#EFF6FF'
    },
    [BREADCRUMB_ROOTS.SHARED_ROOT]: {
        label: 'Được chia sẻ',
        icon: 'share-alt',
        color: '#7C3AED',
        bgColor: '#EDE9FE'
    },
    [BREADCRUMB_ROOTS.TRASH_ROOT]: {
        label: 'Thùng rác',
        icon: 'trash',
        color: '#DC2626',
        bgColor: '#FEE2E2'
    },
    [BREADCRUMB_ROOTS.RECENT_ROOT]: {
        label: 'Gần đây',
        icon: 'clock',
        color: '#059669',
        bgColor: '#D1FAE5'
    }
};

/**
 * Breadcrumb Navigation Component
 * Hiển thị đường dẫn thư mục và cho phép quay lại nhanh
 * 
 * @param {Array} items - Danh sách breadcrumb [{id, name, isRoot, type}, ...]
 * @param {Function} onItemPress - Callback khi nhấn vào item
 * @param {Function} onRootPress - Callback khi nhấn vào root
 * @param {string} rootType - Loại root (MY_ROOT, SHARED_ROOT, TRASH_ROOT, RECENT_ROOT)
 */
const Breadcrumb = ({
    items = [],
    onItemPress,
    onRootPress,
    rootType = BREADCRUMB_ROOTS.MY_ROOT
}) => {
    const rootConfig = ROOT_CONFIG[rootType] || ROOT_CONFIG[BREADCRUMB_ROOTS.MY_ROOT];

    // Nếu đang ở root (không có items), không hiển thị
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Root Button */}
                <TouchableOpacity
                    style={[styles.rootButton, { backgroundColor: rootConfig.bgColor }]}
                    onPress={onRootPress}
                    activeOpacity={0.7}
                >
                    <FontAwesome5 
                        name={rootConfig.icon} 
                        size={12} 
                        color={rootConfig.color} 
                    />
                    <Text style={[styles.rootText, { color: rootConfig.color }]}>
                        {rootConfig.label}
                    </Text>
                </TouchableOpacity>

                {/* Breadcrumb Items */}
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <View key={item.id || index} style={styles.itemContainer}>
                            {/* Separator */}
                            <FontAwesome5
                                name="chevron-right"
                                size={10}
                                color="#9CA3AF"
                                style={styles.separator}
                            />

                            {/* Item */}
                            {isLast ? (
                                // Current folder - không nhấn được
                                <View style={styles.currentItem}>
                                    <FontAwesome5
                                        name="folder"
                                        size={12}
                                        color="#F59E0B"
                                        style={styles.folderIcon}
                                    />
                                    <Text style={styles.currentText} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                </View>
                            ) : (
                                // Parent folder - nhấn được
                                <TouchableOpacity
                                    style={styles.item}
                                    onPress={() => onItemPress?.(item)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.itemText} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10
    },
    rootButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6
    },
    rootText: {
        fontSize: 13,
        fontWeight: '600'
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    separator: {
        marginHorizontal: 8
    },
    item: {
        paddingHorizontal: 8,
        paddingVertical: 4
    },
    itemText: {
        fontSize: 13,
        color: '#6B7280',
        maxWidth: 100
    },
    currentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6
    },
    folderIcon: {
        marginRight: 2
    },
    currentText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#92400E',
        maxWidth: 120
    }
});

export default Breadcrumb;