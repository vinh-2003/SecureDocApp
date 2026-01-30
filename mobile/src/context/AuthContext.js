import React, { createContext, useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';

import authService from '../services/authService';
import { STORAGE_KEYS } from '../api/axiosClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Khởi tạo cấu hình Google Signin (Chạy 1 lần khi app mở)
    // useEffect(() => {
    //     GoogleSignin.configure({
    //         webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, // Lấy từ file .env
    //         offlineAccess: true,
    //     });
    // }, []);

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

    // --- HÀM XỬ LÝ LOGIN THƯỜNG ---
    const login = async (username, password) => {
        try {
            const res = await authService.login(username, password);

            if (res.success) {
                const { accessToken, refreshToken, ...userInfo } = res.data;

                // Lưu Async Storage (Lưu ý phải dùng await)
                await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
                await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
                await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userInfo));

                // Cập nhật State -> App.js sẽ tự động chuyển sang màn hình chính
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

    // --- HÀM XỬ LÝ GOOGLE LOGIN (NATIVE) ---
    const loginWithGoogle = async () => {
        Alert.alert(
            "Thông báo",
            "Tính năng Google Login cần Development Build để chạy. Hãy test Login thường trước."
        );
        // try {
        //     // 1. Kiểm tra Google Play Services
        //     await GoogleSignin.hasPlayServices();

        //     // 2. Mở popup đăng nhập của Google
        //     const userInfo = await GoogleSignin.signIn();

        //     // 3. Lấy idToken
        //     const { idToken } = userInfo;
        //     if (!idToken) throw new Error('Không lấy được Google Token');

        //     // 4. Gửi token lên Backend của bạn để verify và lấy JWT
        //     const res = await authService.googleLogin(idToken);

        //     if (res.success) {
        //         const { accessToken, refreshToken, ...serverUserInfo } = res.data;

        //         await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        //         await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        //         await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(serverUserInfo));

        //         setUser(serverUserInfo);
        //         Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đăng nhập Google thành công!' });
        //     }

        // } catch (error) {
        //     console.error('Google Signin Error:', error);
        //     // Xử lý trường hợp user hủy đăng nhập
        //     if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        //         // User cancelled
        //     } else {
        //         Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Đăng nhập Google thất bại' });
        //     }
        // }
    };

    // --- LOGOUT ---
    const logout = async () => {
        try {
            // Gọi API Logout (nếu cần)
            await authService.logout();

            // Đăng xuất khỏi Google SDK (để lần sau nó hỏi lại tài khoản)
            try {
                await GoogleSignin.signOut();
            } catch (e) { /* Bỏ qua lỗi nếu chưa login google */ }

            // Xóa Storage
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.ACCESS_TOKEN,
                STORAGE_KEYS.REFRESH_TOKEN,
                STORAGE_KEYS.USER
            ]);

            // Reset State -> App tự chuyển về Login
            setUser(null);
        } catch (e) {
            console.error(e);
            // Force logout phía client dù API lỗi
            setUser(null);
        }
    };

    // --- UPDATE USER ---
    const updateUser = async (updatedData) => {
        try {
            const newUser = { ...user, ...updatedData };
            setUser(newUser);
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
        } catch (error) {
            console.error("Lỗi update user storage", error);
        }
    };

    // Màn hình Loading khi đang khởi động App
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