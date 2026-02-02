import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import { Platform, View, Text, StyleSheet } from 'react-native';

import { AuthContext } from '../context/AuthContext';
import { USER_TAB_MENUS, ADMIN_TAB_MENUS } from '../constants/navigation';

// ===== USER SCREENS =====
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import SharedScreen from '../screens/Shared/SharedScreen';
import RecentScreen from '../screens/Recent/RecentScreen';

// ===== ADMIN SCREENS =====
import AdminMonitorScreen from '../screens/Admin/AdminMonitorScreen';
import AdminLogsScreen from '../screens/Admin/AdminLogsScreen';
import AdminUsersScreen from '../screens/Admin/AdminUsersScreen';

const Tab = createBottomTabNavigator();

/**
 * Map screen name to component
 */
const SCREEN_COMPONENTS = {
    // User screens
    DashboardScreen,
    SharedScreen,
    RecentScreen,
    // Admin screens
    AdminMonitorScreen,
    AdminLogsScreen,
    AdminUsersScreen
};

/**
 * Placeholder screen cho các màn hình chưa tạo
 */
const PlaceholderScreen = ({ route }) => (
    <View style={styles.placeholder}>
        <FontAwesome5 name="tools" size={48} color="#9CA3AF" />
        <Text style={styles.placeholderTitle}>{route.name}</Text>
        <Text style={styles.placeholderText}>Màn hình đang phát triển</Text>
    </View>
);

/**
 * MainNavigator - Bottom Tab Navigation
 * Hiển thị TabBar khác nhau dựa trên role của user
 */
const MainNavigator = () => {
    const { user } = useContext(AuthContext);
    
    // Kiểm tra quyền Admin
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');
    
    // Chọn menu phù hợp với role
    const tabMenus = isAdmin ? ADMIN_TAB_MENUS : USER_TAB_MENUS;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#2563EB',
                tabBarInactiveTintColor: '#6B7280',
                tabBarStyle: {
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    paddingTop: 10,
                    backgroundColor: 'white',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 2
                },
                tabBarIcon: ({ focused, color }) => {
                    const menu = tabMenus.find(m => m.name === route.name);
                    return (
                        <FontAwesome5 
                            name={menu?.icon || 'circle'} 
                            size={20} 
                            color={color} 
                            solid={focused}
                        />
                    );
                }
            })}
        >
            {tabMenus.map((menu) => {
                const ScreenComponent = SCREEN_COMPONENTS[menu.screen] || PlaceholderScreen;
                return (
                    <Tab.Screen
                        key={menu.name}
                        name={menu.name}
                        component={ScreenComponent}
                        options={{ 
                            title: menu.label,
                            tabBarLabel: menu.label
                        }}
                    />
                );
            })}
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20
    },
    placeholderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16
    },
    placeholderText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8
    }
});

export default MainNavigator;