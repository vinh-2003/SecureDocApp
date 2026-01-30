import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import CustomModal from '../Common/CustomModal';
import { formatBytes, formatDate } from '../../utils/format';

const InfoRow = ({ label, value, icon }) => (
    <View style={styles.row}>
        <View style={styles.rowLabel}>
            <FontAwesome5 name={icon} size={14} color="#6B7280" style={{ width: 20 }} />
            <Text style={styles.labelText}>{label}</Text>
        </View>
        <Text style={styles.valueText}>{value || '---'}</Text>
    </View>
);

const FileInfoModal = ({ isOpen, onClose, file }) => {
    if (!isOpen || !file) return null;

    const isFolder = file.type === 'FOLDER';

    return (
        <CustomModal visible={isOpen} onClose={onClose}>
            <View style={styles.header}>
                <FontAwesome5
                    name={isFolder ? "folder" : "file-alt"}
                    size={32}
                    color={isFolder ? "#F59E0B" : "#3B82F6"}
                />
                <Text style={styles.title} numberOfLines={2}>{file.name}</Text>
            </View>

            <ScrollView style={styles.content}>
                <InfoRow label="Loại" value={isFolder ? "Thư mục" : file.extension?.toUpperCase() || "File"} icon="file" />
                <InfoRow label="Kích thước" value={isFolder ? '---' : formatBytes(file.size)} icon="hdd" />
                <InfoRow label="Ngày tạo" value={formatDate(file.createdAt)} icon="calendar-plus" />
                <InfoRow label="Cập nhật" value={formatDate(file.updatedAt)} icon="clock" />

                {/* Phần mô tả */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mô tả</Text>
                    <Text style={styles.descText}>
                        {file.description || "Chưa có mô tả"}
                    </Text>
                </View>
            </ScrollView>

            <TouchableOpacity onPress={onClose} style={styles.btnClose}>
                <Text style={styles.textClose}>Đóng</Text>
            </TouchableOpacity>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    header: { alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 16 },
    title: { fontSize: 18, fontWeight: 'bold', marginTop: 12, textAlign: 'center', color: '#1F2937' },
    content: { maxHeight: 300 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
    rowLabel: { flexDirection: 'row', alignItems: 'center' },
    labelText: { color: '#6B7280', fontSize: 14 },
    valueText: { color: '#1F2937', fontWeight: '500', fontSize: 14, flex: 1, textAlign: 'right', marginLeft: 16 },
    section: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 4 },
    descText: { fontSize: 14, color: '#6B7280', fontStyle: 'italic' },
    btnClose: { marginTop: 20, backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, alignItems: 'center' },
    textClose: { color: '#374151', fontWeight: '600' }
});

export default FileInfoModal;