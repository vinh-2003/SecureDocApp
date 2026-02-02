import React, { useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import CustomModal from '../Common/CustomModal';

/**
 * Modal cập nhật mô tả file/folder
 * Đồng bộ với DescriptionModal.jsx trên Web
 * 
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {Function} onClose - Callback đóng modal
 * @param {Function} onSubmit - Callback khi submit
 * @param {Object} item - File/folder đang được cập nhật mô tả
 * @param {string} value - Giá trị textarea (mô tả)
 * @param {Function} onChange - Callback khi thay đổi textarea
 * @param {number} maxLength - Độ dài tối đa của mô tả (default: 1000)
 */
const DescriptionModal = ({
    isOpen,
    onClose,
    onSubmit,
    item,
    value = '',
    onChange,
    maxLength = 1000
}) => {
    const textareaRef = useRef(null);

    useEffect(() => {
        if (isOpen && textareaRef.current) {
            // Focus vào textarea khi modal mở
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (onSubmit) {
            onSubmit(value);
        }
    };

    const currentLength = value?.length || 0;

    return (
        <CustomModal visible={isOpen} onClose={onClose}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconCircle}>
                    <FontAwesome5 name="info-circle" size={18} color="#7C3AED" />
                </View>
                <Text style={styles.title}>Cập nhật mô tả</Text>
            </View>

            {/* Label */}
            <View style={styles.labelContainer}>
                <Text style={styles.label}>Mô tả cho: </Text>
                <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="tail">
                    {item?.name}
                </Text>
            </View>

            {/* TextInput */}
            <TextInput
                ref={textareaRef}
                style={styles.textarea}
                multiline
                numberOfLines={4}
                maxLength={maxLength}
                placeholder="Nhập mô tả chi tiết..."
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={onChange}
                textAlignVertical="top"
            />

            {/* Character count */}
            <Text style={styles.charCount}>
                {currentLength}/{maxLength} ký tự
            </Text>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity 
                    onPress={onClose} 
                    style={styles.btnCancel}
                    activeOpacity={0.7}
                >
                    <Text style={styles.textCancel}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={handleSubmit} 
                    style={styles.btnSubmit}
                    activeOpacity={0.7}
                >
                    <Text style={styles.textSubmit}>Lưu thay đổi</Text>
                </TouchableOpacity>
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EDE9FE', // purple-100
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        flexWrap: 'wrap'
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151'
    },
    fileName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563EB',
        flex: 1,
        maxWidth: 200
    },
    textarea: {
        borderWidth: 1,
        borderColor: '#D1D5DB', // gray-300
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
        minHeight: 120,
        backgroundColor: '#F9FAFB'
    },
    charCount: {
        fontSize: 12,
        color: '#6B7280', // gray-500
        textAlign: 'right',
        marginTop: 6,
        marginBottom: 16
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10
    },
    btnCancel: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#F3F4F6'
    },
    textCancel: {
        color: '#4B5563',
        fontWeight: '600',
        fontSize: 15
    },
    btnSubmit: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#2563EB'
    },
    textSubmit: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15
    }
});

export default DescriptionModal;