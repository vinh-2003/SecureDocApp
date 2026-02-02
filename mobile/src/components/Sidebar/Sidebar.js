import React, { useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Pressable,
    Dimensions,
    Image,
    ScrollView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { AuthContext } from '../../context/AuthContext';
import {
    USER_SIDEBAR_MENUS,
    ADMIN_SIDEBAR_MENUS,
    SIDEBAR_FOOTER_MENUS
} from '../../constants/navigation';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.8;

/**
 * Sidebar Navigation Component
 * Hiển thị menu khác nhau dựa trên role của user
 */
const Sidebar = ({ visible, onClose }) => {
    const navigation = useNavigation();
    const { user, logout } = useContext(AuthContext);

    // Kiểm tra quyền Admin
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    // Chọn menu phù hợp với role
    const sidebarMenus = isAdmin ? ADMIN_SIDEBAR_MENUS : USER_SIDEBAR_MENUS;

    /**
     * Điều hướng đến màn hình và đóng sidebar
     */
    const handleNavigate = (screen, isUserMode = false) => {
        onClose();
        
        // Nếu là chuyển về chế độ User (từ Admin)
        // if (isUserMode) {
        //     // Navigate về Main và reset về HomeTab
        //     navigation.navigate('Main', { screen: 'HomeTab' });
        // } else {
        //     navigation.navigate(screen);
        // }
        navigation.navigate(screen);
    };

    /**
     * Xử lý đăng xuất
     */
    const handleLogout = () => {
        onClose();
        logout();
    };

    /**
     * Render avatar user
     */
    const renderAvatar = () => {
        if (user?.avatarUrl) {
            return (
                <Image
                    source={{ uri: user.avatarUrl }}
                    style={styles.avatar}
                />
            );
        }
        return (
            <View style={styles.avatarPlaceholder}>
                <FontAwesome5 name="user" size={20} color="#6B7280" />
            </View>
        );
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                {/* Backdrop */}
                <Pressable style={styles.backdrop} onPress={onClose} />

                {/* Sidebar Content */}
                <View style={styles.sidebar}>
                    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left']}>
                        {/* Header - Logo */}
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <View style={styles.logoCircle}>
                                    <FontAwesome5 name="shield-alt" size={20} color="#2563EB" />
                                </View>
                                <View>
                                    <Text style={styles.appName}>SecureDoc</Text>
                                    <Text style={styles.appTagline}>
                                        {isAdmin ? 'Quản trị viên' : 'Tài liệu an toàn'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* User Info */}
                        <View style={styles.userSection}>
                            {renderAvatar()}
                            <View style={styles.userInfo}>
                                <Text style={styles.userName} numberOfLines={1}>
                                    {user?.fullName || user?.username || 'Người dùng'}
                                </Text>
                                <Text style={styles.userEmail} numberOfLines={1}>
                                    {user?.email}
                                </Text>
                            </View>
                            {isAdmin && (
                                <View style={styles.adminBadge}>
                                    <Text style={styles.adminBadgeText}>Admin</Text>
                                </View>
                            )}
                        </View>

                        {/* Menu Items */}
                        <ScrollView 
                            style={styles.menuContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Section Title */}
                            <Text style={styles.sectionTitle}>
                                {isAdmin ? 'Chế độ người dùng' : 'Tiện ích'}
                            </Text>

                            {/* Menu Items */}
                            {sidebarMenus.map((item, index) => (
                                <SidebarItem
                                    key={index}
                                    icon={item.icon}
                                    label={item.label}
                                    onPress={() => handleNavigate(item.screen, item.isUserMode)}
                                />
                            ))}

                            {/* Admin Section - Hiển thị cho Admin khi ở chế độ User */}
                            {isAdmin && (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.sectionTitle}>Quản trị</Text>
                                    <SidebarItem
                                        icon="chart-pie"
                                        label="Giám sát tài liệu"
                                        onPress={() => {
                                            onClose();
                                            navigation.navigate('Main', { screen: 'MonitorTab' });
                                        }}
                                    />
                                    <SidebarItem
                                        icon="clipboard-list"
                                        label="Nhật ký truy cập"
                                        onPress={() => {
                                            onClose();
                                            navigation.navigate('Main', { screen: 'LogsTab' });
                                        }}
                                    />
                                    <SidebarItem
                                        icon="users-cog"
                                        label="Quản lý người dùng"
                                        onPress={() => {
                                            onClose();
                                            navigation.navigate('Main', { screen: 'UsersTab' });
                                        }}
                                    />
                                </>
                            )}
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            {/* Profile */}
                            {SIDEBAR_FOOTER_MENUS.map((item, index) => (
                                <SidebarItem
                                    key={index}
                                    icon={item.icon}
                                    label={item.label}
                                    onPress={() => handleNavigate(item.screen)}
                                />
                            ))}

                            <View style={styles.divider} />

                            {/* Logout */}
                            <SidebarItem
                                icon="sign-out-alt"
                                label="Đăng xuất"
                                color="#EF4444"
                                onPress={handleLogout}
                            />
                        </View>
                    </SafeAreaView>
                </View>
            </View>
        </Modal>
    );
};

/**
 * Sidebar Menu Item Component
 */
const SidebarItem = ({ icon, label, onPress, color = '#374151', badge }) => (
    <TouchableOpacity 
        style={styles.menuItem} 
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.menuItemIcon}>
            <FontAwesome5 name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.menuItemText, { color }]}>{label}</Text>
        {badge && (
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
            </View>
        )}
        <FontAwesome5 name="chevron-right" size={12} color="#D1D5DB" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row'
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    sidebar: {
        width: SIDEBAR_WIDTH,
        backgroundColor: 'white',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10
    },
    safeArea: {
        flex: 1
    },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    logoCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center'
    },
    appName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    appTagline: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },

    // User Section
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    userInfo: {
        flex: 1
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937'
    },
    userEmail: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2
    },
    adminBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    adminBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#D97706'
    },

    // Menu
    menuContainer: {
        flex: 1,
        paddingTop: 8
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 20,
        paddingVertical: 12
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20
    },
    menuItemIcon: {
        width: 32,
        alignItems: 'center'
    },
    menuItemText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 8
    },
    badge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 8
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'white'
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 20,
        marginVertical: 8
    },

    // Footer
    footer: {
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingBottom: Platform.OS === 'ios' ? 0 : 16
    }
});

export default Sidebar;