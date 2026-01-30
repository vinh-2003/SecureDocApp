import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { AuthContext } from '../../context/AuthContext';

// Components
import Sidebar from '../Sidebar/Sidebar';

const Header = () => {
    const navigation = useNavigation();
    const { user, logout } = useContext(AuthContext);
    const { showActionSheetWithOptions } = useActionSheet();
    
    const [sidebarVisible, setSidebarVisible] = useState(false);

    // Xử lý Menu Avatar
    const handleAvatarPress = () => {
        const options = ['Thông tin cá nhân', 'Đổi mật khẩu', 'Đăng xuất', 'Hủy'];
        const destructiveButtonIndex = 2;
        const cancelButtonIndex = 3;

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                destructiveButtonIndex,
                title: `Xin chào, ${user?.fullName || 'User'}`
            },
            (selectedIndex) => {
                switch (selectedIndex) {
                    case 0: navigation.navigate('Profile'); break;
                    case 1: navigation.navigate('ChangePassword'); break;
                    case 2: logout(); break;
                }
            }
        );
    };

    return (
        <>
            <View style={styles.container}>
                {/* 1. Sidebar Toggle (3 Gạch) */}
                <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.iconBtn}>
                    <FontAwesome5 name="bars" size={20} color="#374151" />
                </TouchableOpacity>

                {/* 2. Search Bar (Giả lập Input - Bấm vào mở Full Screen) */}
                <TouchableOpacity 
                    style={styles.searchBar} 
                    onPress={() => navigation.navigate('SearchScreen')}
                    activeOpacity={0.9}
                >
                    <FontAwesome5 name="search" size={14} color="#9CA3AF" />
                    <Text style={styles.searchText}>Tìm kiếm...</Text>
                </TouchableOpacity>

                {/* 3. User Avatar */}
                <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
                    {user?.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Sidebar Modal Component */}
            <Sidebar 
                visible={sidebarVisible} 
                onClose={() => setSidebarVisible(false)} 
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        height: 60
    },
    iconBtn: { padding: 8 },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 20, // Bo tròn kiểu thanh search
        paddingHorizontal: 12,
        height: 36,
        marginHorizontal: 12
    },
    searchText: {
        color: '#9CA3AF',
        marginLeft: 8,
        fontSize: 14
    },
    avatarContainer: { padding: 4 },
    avatar: { width: 32, height: 32, borderRadius: 16 },
    avatarPlaceholder: { backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default Header;