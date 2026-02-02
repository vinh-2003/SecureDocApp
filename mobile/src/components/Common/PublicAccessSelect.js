import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Component chọn quyền truy cập công khai
 * Đồng bộ với PublicAccessSelect.jsx trên Web
 * 
 * @param {string} value - Giá trị hiện tại ('PRIVATE', 'PUBLIC_VIEW', 'PUBLIC_EDIT')
 * @param {Function} onChange - Callback khi thay đổi giá trị
 */
const PublicAccessSelect = ({ value, onChange }) => {
    const [showPicker, setShowPicker] = useState(false);

    const OPTIONS = [
        {
            value: 'PRIVATE',
            label: 'Hạn chế',
            description: 'Chỉ những người được thêm mới có thể mở.',
            icon: 'lock',
            iconBgColor: '#F3F4F6',
            iconColor: '#6B7280'
        },
        {
            value: 'PUBLIC_VIEW',
            label: 'Bất kỳ ai có đường liên kết (Người xem)',
            description: 'Bất kỳ ai có liên kết đều có thể xem.',
            icon: 'eye',
            iconBgColor: '#DBEAFE',
            iconColor: '#2563EB'
        },
        {
            value: 'PUBLIC_EDIT',
            label: 'Bất kỳ ai có đường liên kết (Người chỉnh sửa)',
            description: 'Bất kỳ ai có liên kết đều có thể chỉnh sửa.',
            icon: 'globe',
            iconBgColor: '#D1FAE5',
            iconColor: '#10B981'
        }
    ];

    const selectedOption = OPTIONS.find(opt => opt.value === value) || OPTIONS[0];
    const isPrivate = value === 'PRIVATE';

    const handleSelect = (optionValue) => {
        if (onChange) onChange(optionValue);
        setShowPicker(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Quyền truy cập chung</Text>

            {/* Selected Option Button */}
            <TouchableOpacity 
                style={styles.selectedButton}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
            >
                <View style={[
                    styles.iconCircle, 
                    { backgroundColor: isPrivate ? '#F3F4F6' : '#D1FAE5' }
                ]}>
                    <FontAwesome5 
                        name={isPrivate ? 'lock' : 'globe'} 
                        size={14} 
                        color={isPrivate ? '#6B7280' : '#10B981'} 
                    />
                </View>
                <View style={styles.selectedTextContainer}>
                    <Text style={styles.selectedLabel}>{selectedOption.label}</Text>
                    <Text style={styles.selectedDescription} numberOfLines={1}>
                        {selectedOption.description}
                    </Text>
                </View>
                <FontAwesome5 name="chevron-down" size={12} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Options Modal */}
            <Modal
                visible={showPicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPicker(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowPicker(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chọn quyền truy cập</Text>
                        
                        {OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.optionItem,
                                    value === option.value && styles.optionItemActive
                                ]}
                                onPress={() => handleSelect(option.value)}
                            >
                                <View style={[
                                    styles.optionIcon,
                                    { backgroundColor: option.iconBgColor }
                                ]}>
                                    <FontAwesome5 
                                        name={option.icon} 
                                        size={14} 
                                        color={option.iconColor} 
                                    />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>{option.label}</Text>
                                    <Text style={styles.optionDescription}>
                                        {option.description}
                                    </Text>
                                </View>
                                {value === option.value && (
                                    <FontAwesome5 name="check" size={14} color="#2563EB" />
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
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12
    },
    selectedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    selectedTextContainer: {
        flex: 1
    },
    selectedLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937'
    },
    selectedDescription: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
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
        maxWidth: 400
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
        textAlign: 'center'
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 8
    },
    optionItemActive: {
        backgroundColor: '#EFF6FF'
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    optionTextContainer: {
        flex: 1
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937'
    },
    optionDescription: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    }
});

export default PublicAccessSelect;