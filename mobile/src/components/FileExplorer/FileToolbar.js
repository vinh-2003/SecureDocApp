import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Pressable
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Toolbar cho File Explorer
 * Bao gồm: Title, View Mode Toggle, Sort Options
 */
const FileToolbar = ({
    title = 'Tài liệu của tôi',
    viewMode = 'list',
    onViewModeChange,
    sortValue = 'createdAt-desc',
    onSortChange,
    showSort = true,
    showTitle = true
}) => {
    const [showSortModal, setShowSortModal] = useState(false);

    const SORT_OPTIONS = [
        { value: 'name-asc', label: 'Tên (A-Z)', icon: 'sort-alpha-down' },
        { value: 'name-desc', label: 'Tên (Z-A)', icon: 'sort-alpha-up' },
        { value: 'createdAt-desc', label: 'Mới nhất', icon: 'calendar-plus' },
        { value: 'createdAt-asc', label: 'Cũ nhất', icon: 'calendar-minus' },
        { value: 'size-desc', label: 'Lớn nhất', icon: 'sort-amount-down' },
        { value: 'size-asc', label: 'Nhỏ nhất', icon: 'sort-amount-up' }
    ];

    const currentSort = SORT_OPTIONS.find(opt => opt.value === sortValue) || SORT_OPTIONS[2];

    const handleSortSelect = (option) => {
        const [sortBy, direction] = option.value.split('-');
        onSortChange?.({ sortBy, direction });
        setShowSortModal(false);
    };

    return (
        <View style={styles.container}>
            {/* Title */}
            {showTitle && title ? (
                <Text style={styles.title} numberOfLines={1}>
                    {title}
                </Text>
            ) : (
                <View style={styles.spacer} />
            )}

            {/* Actions */}
            <View style={styles.actions}>
                {/* Sort Button */}
                {showSort && (
                    <TouchableOpacity
                        style={styles.sortButton}
                        onPress={() => setShowSortModal(true)}
                    >
                        <FontAwesome5 name={currentSort.icon} size={14} color="#6B7280" />
                        <Text style={styles.sortButtonText}>{currentSort.label}</Text>
                        <FontAwesome5 name="caret-down" size={10} color="#9CA3AF" />
                    </TouchableOpacity>
                )}

                {/* View Mode Toggle */}
                <View style={styles.viewModeToggle}>
                    <TouchableOpacity
                        style={[
                            styles.viewModeButton,
                            viewMode === 'list' && styles.viewModeButtonActive
                        ]}
                        onPress={() => onViewModeChange?.('list')}
                    >
                        <FontAwesome5
                            name="list"
                            size={14}
                            color={viewMode === 'list' ? '#2563EB' : '#6B7280'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.viewModeButton,
                            viewMode === 'grid' && styles.viewModeButtonActive
                        ]}
                        onPress={() => onViewModeChange?.('grid')}
                    >
                        <FontAwesome5
                            name="th-large"
                            size={14}
                            color={viewMode === 'grid' ? '#2563EB' : '#6B7280'}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Sort Modal */}
            <Modal
                visible={showSortModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSortModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowSortModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Sắp xếp theo</Text>
                        {SORT_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.modalOption,
                                    sortValue === option.value && styles.modalOptionActive
                                ]}
                                onPress={() => handleSortSelect(option)}
                            >
                                <FontAwesome5
                                    name={option.icon}
                                    size={16}
                                    color={sortValue === option.value ? '#2563EB' : '#6B7280'}
                                />
                                <Text style={[
                                    styles.modalOptionText,
                                    sortValue === option.value && styles.modalOptionTextActive
                                ]}>
                                    {option.label}
                                </Text>
                                {sortValue === option.value && (
                                    <FontAwesome5 name="check" size={14} color="#2563EB" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
        marginRight: 12
    },
    spacer: {
        flex: 1
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 8
    },
    sortButtonText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500'
    },
    viewModeToggle: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 2
    },
    viewModeButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6
    },
    viewModeButtonActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
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
        padding: 16,
        width: '100%',
        maxWidth: 300
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
        textAlign: 'center'
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 10
    },
    modalOptionActive: {
        backgroundColor: '#EFF6FF'
    },
    modalOptionText: {
        flex: 1,
        fontSize: 15,
        color: '#374151'
    },
    modalOptionTextActive: {
        color: '#2563EB',
        fontWeight: '600'
    }
});

export default FileToolbar;