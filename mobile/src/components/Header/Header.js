import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { AuthContext } from '../../context/AuthContext';

// Utils
import { getAvatarUrl } from '../../utils/urlHelper';

// Components
import Sidebar from '../Sidebar/Sidebar';

const Header = () => {
    const navigation = useNavigation();
    const { user, logout } = useContext(AuthContext);
    const { showActionSheetWithOptions } = useActionSheet();
    
    const [sidebarVisible, setSidebarVisible] = useState(false);
    
    // State để bắt lỗi nếu ảnh không tải được
    const [imageError, setImageError] = useState(false);

    // Reset trạng thái lỗi khi user thay đổi (ví dụ login user khác)
    useEffect(() => {
        setImageError(false);
    }, [user]);

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
                title: `Xin chào, ${user?.fullName || user?.username || 'User'}`,
                message: user?.email || ''
            },
            (selectedIndex) => {
                switch (selectedIndex) {
                    case 0: 
                        navigation.navigate('ProfileScreen'); 
                        break;
                    case 1: 
                        navigation.navigate('ChangePasswordScreen'); 
                        break;
                    case 2: 
                        logout(); 
                        break;
                }
            }
        );
    };

    // Lấy avatar URL
    const avatarUrl = getAvatarUrl(user);

    return (
        <>
            <View style={styles.container}>
                {/* 1. Sidebar Toggle */}
                <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.iconBtn}>
                    <FontAwesome5 name="bars" size={20} color="#374151" />
                </TouchableOpacity>

                {/* 2. Search Bar */}
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
                    {/* Logic: Nếu có URL VÀ chưa bị lỗi -> Hiện ảnh. Ngược lại -> Hiện Icon */}
                    {avatarUrl && !imageError ? (
                        <Image 
                            source={{ uri: avatarUrl }} 
                            style={styles.avatar}
                            onError={() => setImageError(true)} // Nếu tải lỗi -> chuyển sang icon
                        />
                    ) : (
                        // Icon mặc định (Fallback)
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <FontAwesome5 name="user" size={18} color="#2563EB" />
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
    iconBtn: { 
        padding: 8 
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 12,
        height: 36,
        marginHorizontal: 12
    },
    searchText: {
        color: '#9CA3AF',
        marginLeft: 8,
        fontSize: 14
    },
    avatarContainer: { 
        padding: 4 
    },
    avatar: { 
        width: 36, 
        height: 36, 
        borderRadius: 18,
        borderWidth: 1, // Giảm độ dày viền cho đẹp hơn
        borderColor: '#E5E7EB',
        backgroundColor: '#F3F4F6' 
    },
    // Style riêng cho khung chứa Icon mặc định
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E5E7EB' // Màu nền xám đậm hơn chút cho nổi icon
    }
});

export default Header;