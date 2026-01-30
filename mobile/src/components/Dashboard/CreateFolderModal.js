import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import CustomModal from '../Common/CustomModal';

const CreateFolderModal = ({ isOpen, onClose, onSubmit }) => {
    const [folderName, setFolderName] = useState('');

    // Reset text khi mở modal
    useEffect(() => {
        if (isOpen) setFolderName('');
    }, [isOpen]);

    const handleSubmit = () => {
        if (!folderName.trim()) return;
        onSubmit(folderName.trim());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <CustomModal visible={isOpen} onClose={onClose}>
            <Text style={styles.title}>Tạo thư mục mới</Text>

            <TextInput
                style={styles.input}
                placeholder="Nhập tên thư mục..."
                value={folderName}
                onChangeText={setFolderName}
                autoFocus
            />

            <View style={styles.actions}>
                <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
                    <Text style={styles.textCancel}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSubmit}
                    style={[styles.btnSubmit, !folderName.trim() && styles.btnDisabled]}
                    disabled={!folderName.trim()}
                >
                    <Text style={styles.textSubmit}>Tạo</Text>
                </TouchableOpacity>
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1F2937' },
    input: {
        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12,
        fontSize: 16, marginBottom: 20,
    },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    btnCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
    textCancel: { color: '#4B5563', fontWeight: '500' },
    btnSubmit: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    btnDisabled: { backgroundColor: '#93C5FD' },
    textSubmit: { color: 'white', fontWeight: 'bold' },
});

export default CreateFolderModal;