import React, { useContext } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75; // Sidebar chiếm 75% màn hình

const SidebarItem = ({ icon, label, onPress, color = '#374151' }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
        <View style={{ width: 32, alignItems: 'center' }}>
            <FontAwesome5 name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.itemText, { color }]}>{label}</Text>
    </TouchableOpacity>
);

const Sidebar = ({ visible, onClose }) => {
    const navigation = useNavigation();
    const { user, logout } = useContext(AuthContext);

    const handleNavigate = (screen) => {
        onClose();
        navigation.navigate(screen);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                {/* Vùng tối mờ bên phải để đóng menu */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                {/* Nội dung Sidebar */}
                <View style={styles.sidebar}>
                    <SafeAreaView style={{ flex: 1 }}>
                        {/* 1. Header Logo */}
                        <View style={styles.header}>
                            <View style={styles.logoCircle}>
                                <FontAwesome5 name="folder-open" size={24} color="#2563EB" />
                            </View>
                            <Text style={styles.appName}>SecureDoc</Text>
                        </View>

                        {/* 2. Menu Items (Các mục KHÔNG CÓ trong TabBar) */}
                        <View style={styles.menuContainer}>
                            <Text style={styles.sectionTitle}>Tiện ích</Text>
                            
                            <SidebarItem 
                                icon="clock" 
                                label="Gần đây" 
                                onPress={() => handleNavigate('Recent')} 
                            />
                            <SidebarItem 
                                icon="user-shield" 
                                label="Yêu cầu truy cập" 
                                onPress={() => handleNavigate('Requests')} 
                            />
                            <SidebarItem 
                                icon="trash" 
                                label="Thùng rác" 
                                onPress={() => handleNavigate('Trash')} 
                            />
                            
                            {/* Admin Section (Nếu user là admin) */}
                            {user?.roles?.includes('ROLE_ADMIN') && (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.sectionTitle}>Quản trị</Text>
                                    <SidebarItem 
                                        icon="users-cog" 
                                        label="Quản lý người dùng" 
                                        onPress={() => handleNavigate('AdminUsers')} 
                                    />
                                    <SidebarItem 
                                        icon="clipboard-list" 
                                        label="Nhật ký hệ thống" 
                                        onPress={() => handleNavigate('AdminLogs')} 
                                    />
                                </>
                            )}
                        </View>

                        {/* 3. Footer Logout */}
                        <View style={styles.footer}>
                            <SidebarItem 
                                icon="sign-out-alt" 
                                label="Đăng xuất" 
                                color="#EF4444" 
                                onPress={() => { onClose(); logout(); }} 
                            />
                        </View>
                    </SafeAreaView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, flexDirection: 'row' },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    sidebar: { 
        width: SIDEBAR_WIDTH, 
        backgroundColor: 'white', 
        height: '100%', 
        position: 'absolute', 
        left: 0,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: { 
        flexDirection: 'row', alignItems: 'center', padding: 20, 
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6' 
    },
    logoCircle: { 
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', 
        justifyContent: 'center', alignItems: 'center', marginRight: 12 
    },
    appName: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
    menuContainer: { flex: 1, paddingVertical: 16 },
    sectionTitle: { fontSize: 12, color: '#9CA3AF', fontWeight: 'bold', marginLeft: 20, marginBottom: 8, marginTop: 8, textTransform: 'uppercase' },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 },
    itemText: { fontSize: 16, fontWeight: '500', marginLeft: 12 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8, marginHorizontal: 20 },
    footer: { paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' }
});

export default Sidebar;