import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { SORT_OPTIONS } from '../../constants/app';

const FileToolbar = ({
    title,
    viewMode,
    onViewModeChange,
    sortValue, // Giá trị hiện tại: 'updatedAt-desc'
    onSortChange
}) => {
    const { showActionSheetWithOptions } = useActionSheet();

    // Xử lý mở menu sắp xếp
    const handleSortPress = () => {
        // Tạo mảng label cho ActionSheet
        const options = [...SORT_OPTIONS.map(opt => opt.label), 'Hủy'];
        const cancelButtonIndex = options.length - 1;

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                title: 'Sắp xếp theo'
            },
            (selectedIndex) => {
                if (selectedIndex !== cancelButtonIndex) {
                    // Lấy value tương ứng với index đã chọn
                    const selectedOption = SORT_OPTIONS[selectedIndex];
                    if (selectedOption) {
                        // Tách value thành sortBy và direction (VD: updatedAt-desc -> { sortBy: 'updatedAt', direction: 'desc' })
                        const [sortBy, direction] = selectedOption.value.split('-');
                        onSortChange({ sortBy, direction });
                    }
                }
            }
        );
    };

    // Tìm label của sort hiện tại để hiển thị
    const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === sortValue)?.label || 'Sắp xếp';

    return (
        <View style={styles.container}>
            {/* Tiêu đề (Bên trái) */}
            <Text style={styles.title} numberOfLines={1}>{title || 'Tài liệu'}</Text>

            <View style={styles.actions}>
                {/* Nút Sắp xếp (Dạng Chip/Badge) */}
                <TouchableOpacity onPress={handleSortPress} style={styles.sortBtn}>
                    <FontAwesome5 name="sort-amount-down" size={12} color="#4B5563" style={{ marginRight: 6 }} />
                    <Text style={styles.sortText}>{currentSortLabel}</Text>
                </TouchableOpacity>

                {/* Nút Chuyển View (List/Grid) */}
                <TouchableOpacity
                    onPress={() => onViewModeChange(viewMode === 'list' ? 'grid' : 'list')}
                    style={styles.iconBtn}
                >
                    <FontAwesome5
                        name={viewMode === 'list' ? 'th-large' : 'list'}
                        size={16}
                        color="#4B5563"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
        marginRight: 10
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20, // Bo tròn kiểu Chip
    },
    sortText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#374151'
    },
    iconBtn: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 8
    }
});

export default FileToolbar;