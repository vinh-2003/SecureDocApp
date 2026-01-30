import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Import các màn hình vừa tạo
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import FileExplorerScreen from '../screens/FileExplorer/FileExplorerScreen';
import SharedScreen from '../screens/Shared/SharedScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false, // Ẩn header mặc định của Tab (chúng ta sẽ tự custom Header sau)
                tabBarActiveTintColor: '#2563EB', // Màu xanh active giống Web
                tabBarInactiveTintColor: '#6B7280', // Màu xám inactive
                tabBarStyle: {
                    height: Platform.OS === 'ios' ? 88 : 60,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
                // Cấu hình Icon cho từng Tab
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'HomeTab') {
                        iconName = 'home';
                    } else if (route.name === 'FilesTab') {
                        iconName = 'folder';
                    } else if (route.name === 'SharedTab') {
                        iconName = 'users';
                    } else if (route.name === 'ProfileTab') {
                        iconName = 'user-circle';
                    }

                    // Dùng solid icon khi active, regular khi inactive (nếu bộ icon hỗ trợ)
                    return <FontAwesome5 name={iconName} size={20} color={color} solid={focused} />;
                },
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={DashboardScreen}
                options={{ title: 'Trang chủ' }}
            />
            <Tab.Screen
                name="FilesTab"
                component={FileExplorerScreen}
                options={{ title: 'Tệp' }}
            />
            <Tab.Screen
                name="SharedTab"
                component={SharedScreen}
                options={{ title: 'Đã chia sẻ' }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{ title: 'Cá nhân' }}
            />
        </Tab.Navigator>
    );
};

export default MainNavigator;