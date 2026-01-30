import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, View } from 'react-native';
import CustomModal from '../Common/CustomModal'; // Đã tạo ở bài trước

const RenameModal = ({ isOpen, onClose, onSubmit, currentName }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen) setName(currentName || '');
    }, [isOpen, currentName]);

    const handleSubmit = () => {
        if (!name.trim() || name === currentName) return;
        onSubmit(name.trim());
    };

    if (!isOpen) return null;

    return (
        <CustomModal visible={isOpen} onClose={onClose}>
            <Text style={styles.title}>Đổi tên</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoFocus
                selectTextOnFocus
            />
            <View style={styles.actions}>
                <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
                    <Text style={{ color: '#4B5563' }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} style={styles.btnSubmit}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Lưu</Text>
                </TouchableOpacity>
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    btnCancel: { padding: 10 },
    btnSubmit: { backgroundColor: '#2563EB', padding: 10, borderRadius: 8, paddingHorizontal: 20 }
});

export default RenameModal;