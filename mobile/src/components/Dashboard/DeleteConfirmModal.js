import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import CustomModal from '../Common/CustomModal';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, count = 1, loading }) => {
    if (!isOpen) return null;

    return (
        <CustomModal visible={isOpen} onClose={onClose}>
            <View style={styles.header}>
                <View style={styles.iconCircle}>
                    <FontAwesome5 name="trash-alt" size={24} color="#EF4444" />
                </View>
                <Text style={styles.title}>Xác nhận xóa</Text>
            </View>

            <Text style={styles.message}>
                Bạn có chắc chắn muốn chuyển {count} mục này vào thùng rác không?
            </Text>

            <View style={styles.actions}>
                <TouchableOpacity onPress={onClose} style={styles.btnCancel} disabled={loading}>
                    <Text style={styles.textCancel}>Hủy bỏ</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onConfirm} style={styles.btnDelete} disabled={loading}>
                    {loading ? (
                        <Text style={styles.textDelete}>Đang xóa...</Text>
                    ) : (
                        <Text style={styles.textDelete}>Xóa ngay</Text>
                    )}
                </TouchableOpacity>
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    header: { alignItems: 'center', marginBottom: 16 },
    iconCircle: {
        width: 50, height: 50, borderRadius: 25, backgroundColor: '#FEE2E2',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12
    },
    title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    message: { textAlign: 'center', color: '#6B7280', marginBottom: 24, fontSize: 15 },
    actions: { flexDirection: 'row', gap: 12 },
    btnCancel: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
    textCancel: { color: '#374151', fontWeight: '600' },
    btnDelete: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center' },
    textDelete: { color: 'white', fontWeight: '600' }
});

export default DeleteConfirmModal;