import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

const RoleSelectModal = ({ visible, onClose, onConfirm, initialRoles = [], isLoading }) => {
    const [selectedRoles, setSelectedRoles] = useState(initialRoles);

    useEffect(() => {
        if (visible) setSelectedRoles(initialRoles);
    }, [visible, initialRoles]);

    const toggleRole = (role) => {
        if (role === 'ROLE_USER') return; // Không cho bỏ ROLE_USER
        
        if (selectedRoles.includes(role)) {
            setSelectedRoles(prev => prev.filter(r => r !== role));
        } else {
            setSelectedRoles(prev => [...prev, role]);
        }
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <FontAwesome5 name="user-shield" size={18} color="#2563EB" />
                        </View>
                        <Text style={styles.title}>Phân quyền người dùng</Text>
                    </View>

                    <View style={styles.body}>
                        {/* Option: USER */}
                        <TouchableOpacity style={[styles.option, styles.disabledOption]} activeOpacity={1}>
                            <Ionicons name="checkbox" size={24} color="#9CA3AF" />
                            <View style={styles.optionText}>
                                <Text style={styles.roleName}>Người dùng (User)</Text>
                                <Text style={styles.roleDesc}>Quyền cơ bản</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Option: ADMIN */}
                        <TouchableOpacity 
                            style={styles.option} 
                            onPress={() => toggleRole('ROLE_ADMIN')}
                        >
                            <Ionicons 
                                name={selectedRoles.includes('ROLE_ADMIN') ? "checkbox" : "square-outline"} 
                                size={24} 
                                color={selectedRoles.includes('ROLE_ADMIN') ? "#2563EB" : "#6B7280"} 
                            />
                            <View style={styles.optionText}>
                                <Text style={styles.roleName}>Quản trị viên (Admin)</Text>
                                <Text style={styles.roleDesc}>Toàn quyền hệ thống</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
                            <Text style={styles.txtCancel}>Hủy</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.btnConfirm} 
                            onPress={() => onConfirm(selectedRoles)}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Text style={styles.txtConfirm}>Lưu thay đổi</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    container: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    iconContainer: { width: 32, height: 32, backgroundColor: '#EFF6FF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    body: { padding: 16 },
    option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    disabledOption: { opacity: 0.7 },
    optionText: { marginLeft: 12 },
    roleName: { fontSize: 14, fontWeight: '600', color: '#374151' },
    roleDesc: { fontSize: 12, color: '#6B7280' },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, backgroundColor: '#F9FAFB', gap: 10 },
    btnCancel: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFF' },
    txtCancel: { color: '#374151', fontSize: 13, fontWeight: '500' },
    btnConfirm: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: '#2563EB', justifyContent: 'center', minWidth: 100, alignItems: 'center' },
    txtConfirm: { color: '#FFF', fontSize: 13, fontWeight: '500' }
});

export default RoleSelectModal;