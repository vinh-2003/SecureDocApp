import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import CustomModal from '../Common/CustomModal';

/**
 * Modal đổi tên file/folder
 * Cập nhật để hỗ trợ cả controlled và uncontrolled mode
 * 
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {Function} onClose - Callback đóng modal
 * @param {Function} onSubmit - Callback khi submit
 * @param {string} currentName - Tên hiện tại (uncontrolled mode)
 * @param {string} value - Giá trị input (controlled mode)
 * @param {Function} onChange - Callback khi thay đổi input (controlled mode)
 */
const RenameModal = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    currentName,
    value,
    onChange 
}) => {
    // Local state cho uncontrolled mode
    const [localName, setLocalName] = useState('');

    // Xác định mode: controlled nếu có value và onChange
    const isControlled = value !== undefined && onChange !== undefined;
    const inputValue = isControlled ? value : localName;
    const setInputValue = isControlled ? onChange : setLocalName;

    useEffect(() => {
        if (isOpen) {
            // Reset giá trị khi modal mở
            if (isControlled && value === undefined) {
                onChange(currentName || '');
            } else if (!isControlled) {
                setLocalName(currentName || '');
            }
        }
    }, [isOpen, currentName]);

    const handleSubmit = () => {
        const trimmedName = inputValue?.trim();
        if (!trimmedName || trimmedName === currentName) return;
        
        if (onSubmit) {
            onSubmit(trimmedName);
        }
    };

    if (!isOpen) return null;

    return (
        <CustomModal visible={isOpen} onClose={onClose}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconCircle}>
                    <FontAwesome5 name="edit" size={16} color="#2563EB" />
                </View>
                <Text style={styles.title}>Đổi tên</Text>
            </View>

            {/* Input */}
            <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                autoFocus
                selectTextOnFocus
                placeholder="Nhập tên mới..."
                placeholderTextColor="#9CA3AF"
            />

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
                    <Text style={styles.textCancel}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} style={styles.btnSubmit}>
                    <Text style={styles.textSubmit}>Lưu</Text>
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
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 14,
        marginBottom: 20,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#F9FAFB'
    },
    actions: {
        flexDirection: 'row',
        gap: 12
    },
    btnCancel: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center'
    },
    textCancel: {
        color: '#4B5563',
        fontWeight: '600',
        fontSize: 15
    },
    btnSubmit: {
        flex: 1,
        backgroundColor: '#2563EB',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center'
    },
    textSubmit: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15
    }
});

export default RenameModal;