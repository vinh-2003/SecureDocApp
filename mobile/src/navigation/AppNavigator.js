// src/navigation/AppNavigator.js
import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

// Import các màn hình ĐÃ CÓ
import LoginScreen from '../screens/Auth/LoginScreen'; 
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import SearchScreen from '../screens/Search/SearchScreen';

import MainNavigator from './MainNavigator';

// Tạo Stack
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // === APP CHÍNH (Đã đăng nhập) ===
        <Stack.Group>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="FolderDetail" component={DashboardScreen} />
          <Stack.Screen name="SearchScreen" component={SearchScreen} />
        </Stack.Group>
      ) : (
        // === AUTH (Chưa đăng nhập) ===
        <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;