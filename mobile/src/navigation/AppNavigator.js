import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

// ===== AUTH SCREENS =====
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';

// ===== MAIN NAVIGATOR =====
import MainNavigator from './MainNavigator';

// ===== COMMON SCREENS =====
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import SharedScreen from '../screens/Shared/SharedScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ChangePasswordScreen from '../screens/Profile/ChangePasswordScreen';

// ===== SCREENS FROM SIDEBAR =====
import RecentScreen from '../screens/Recent/RecentScreen';
import TrashScreen from '../screens/Trash/TrashScreen';
import RequestsScreen from '../screens/Requests/RequestsScreen';
import ActivitiesScreen from '../screens/Activities/ActivitiesScreen';

// ===== ADMIN SCREENS =====
import AdminMonitorScreen from '../screens/Admin/AdminMonitorScreen';
import AdminLogsScreen from '../screens/Admin/AdminLogsScreen';
import AdminUsersScreen from '../screens/Admin/AdminUsersScreen';

import FileViewerScreen from '../screens/FileViewer/FileViewerScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                // ===== AUTHENTICATED ROUTES =====
                <Stack.Group>
                    {/* Main Tab Navigator */}
                    <Stack.Screen name="Main" component={MainNavigator} />

                    {/* Folder Detail - trong "Tài liệu của tôi" */}
                    <Stack.Screen name="FolderDetail" component={DashboardScreen} />

                    {/* Shared Folder - trong "Được chia sẻ" */}
                    <Stack.Screen name="SharedFolder" component={SharedScreen} />

                    <Stack.Screen name="UserDashboard" component={DashboardScreen} />
                    <Stack.Screen name="UserShared" component={SharedScreen} />

                    {/* Common Screens */}
                    <Stack.Screen name="SearchScreen" component={SearchScreen} />
                    
                    {/* Profile Screens */}
                    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
                    <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />

                    {/* Sidebar Screens (User) */}
                    <Stack.Screen name="RecentScreen" component={RecentScreen} />
                    <Stack.Screen name="TrashScreen" component={TrashScreen} />
                    <Stack.Screen name="RequestsScreen" component={RequestsScreen} />
                    <Stack.Screen name="ActivitiesScreen" component={ActivitiesScreen} />

                    {/* Admin Screens */}
                    <Stack.Screen name="AdminMonitorScreen" component={AdminMonitorScreen} />
                    <Stack.Screen name="AdminLogsScreen" component={AdminLogsScreen} />
                    <Stack.Screen name="AdminUsersScreen" component={AdminUsersScreen} />

                    <Stack.Screen name="FileViewer" component={FileViewerScreen} />
                </Stack.Group>
            ) : (
                // ===== AUTH ROUTES =====
                <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                </Stack.Group>
            )}
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    }
});

export default AppNavigator;