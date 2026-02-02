import React, { createContext, useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

// [NEW] Import thư viện Expo Auth
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import authService from '../services/authService';
import { STORAGE_KEYS } from '../api/axiosClient';

// [NEW] Cần thiết để popup web tắt đúng cách sau khi login trên Web/Mobile
WebBrowser.maybeCompleteAuthSession();

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // [NEW] 1. Cấu hình Google Auth Request
    // Expo Go chủ yếu dùng webClientId để hoạt động.
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, // <--- THAY CLIENT ID CỦA BẠN VÀO ĐÂY
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        // iosClientId: '...',     // Dùng sau này nếu build file .ipa
    });

    // Hàm kiểm tra trạng thái đăng nhập khi mở App
    const loadUserFromStorage = async () => {
        try {
            setLoading(true);
            const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
            const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

            if (storedUser && token) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.log('Lỗi khôi phục user:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserFromStorage();
    }, []);

    // [NEW] 2. Lắng nghe kết quả trả về từ Google Popup
    useEffect(() => {
        if (response?.type === 'success') {
            // Lấy ID Token từ kết quả trả về
            const { authentication } = response;
            // Gửi token này lên Backend
            handleServerAuth(authentication.accessToken); // Hoặc authentication.idToken tùy backend yêu cầu
        } else if (response?.type === 'error') {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Đăng nhập Google thất bại' });
        }
    }, [response]);

    // [NEW] 3. Hàm xử lý gửi token lên Server (Backend của bạn)
    const handleServerAuth = async (googleToken) => {
        try {
            setLoading(true); // Bật loading toàn màn hình (hoặc xử lý nội bộ)
            
            // Gọi API login google của bạn
            // Lưu ý: Backend cần endpoint nhận { token: "..." }
            const res = await authService.loginWithGoogle(googleToken);

            if (res.success) {
                const { accessToken, refreshToken, ...serverUserInfo } = res.data;

                // Lưu storage
                await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
                await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
                await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(serverUserInfo));

                // Cập nhật State
                setUser(serverUserInfo);
                Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đăng nhập Google thành công!' });
            }
        } catch (error) {
            console.error('Server Auth Error:', error);
            const msg = error.response?.data?.message || 'Xác thực với Server thất bại';
            Toast.show({ type: 'error', text1: 'Lỗi', text2: msg });
        } finally {
            setLoading(false);
        }
    };

    // --- HÀM LOGIN THƯỜNG ---
    const login = async (username, password) => {
        try {
            const res = await authService.login(username, password);

            if (res.success) {
                const { accessToken, refreshToken, ...userInfo } = res.data;

                await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
                await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
                await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userInfo));

                setUser(userInfo);

                Toast.show({
                    type: 'success',
                    text1: 'Xin chào!',
                    text2: 'Đăng nhập thành công 👋'
                });
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Đăng nhập thất bại';
            Toast.show({ type: 'error', text1: 'Lỗi', text2: msg });
        }
    };

    // --- HÀM KÍCH HOẠT GOOGLE LOGIN (Được gọi từ LoginScreen) ---
    const loginWithGoogle = async () => {
        // Mở trình duyệt popup để user đăng nhập
        await promptAsync();
    };

    // --- LOGOUT ---
    const logout = async () => {
        try {
            await authService.logout(); // API Logout
            
            // Xóa Auth Session của Expo (nếu cần)
            // WebBrowser.dismissAuthSession(); 

            await AsyncStorage.multiRemove([
                STORAGE_KEYS.ACCESS_TOKEN,
                STORAGE_KEYS.REFRESH_TOKEN,
                STORAGE_KEYS.USER
            ]);

            setUser(null);
        } catch (e) {
            console.error(e);
            setUser(null);
        }
    };

    const updateUser = async (updatedData) => {
        try {
            const newUser = { ...user, ...updatedData };
            setUser(newUser);
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
        } catch (error) {
            console.error("Lỗi update user storage", error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});