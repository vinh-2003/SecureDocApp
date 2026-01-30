import React from 'react';
import { View, TouchableOpacity, Text, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import AuthLayout from '../../components/Auth/AuthLayout';
import AuthInput from '../../components/Auth/AuthInput';
import AuthButton from '../../components/Auth/AuthButton';
import AuthDivider from '../../components/Auth/AuthDivider';

// Import Hook đã tái sử dụng
import useLogin from '../../hooks/useLogin';

const LoginScreen = ({ navigation }) => {
    // Hook trả về control và các hàm xử lý
    const { control, loading, handleLogin, handleGoogleLogin } = useLogin();
    // control: chứa cả register, formState, errors...
    const { handleSubmit } = control;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <AuthLayout title="Chào mừng trở lại" subtitle="Đăng nhập để tiếp tục sử dụng SecureDoc">

                    <View>
                        {/* Input Username */}
                        <AuthInput
                            control={control} // Truyền control vào
                            name="username"
                            icon="user"
                            label="Tên đăng nhập"
                            placeholder="Nhập tên đăng nhập"
                            rules={{ required: 'Vui lòng nhập tên đăng nhập' }} // Validate rule
                        />

                        {/* Input Password */}
                        <AuthInput
                            control={control}
                            name="password"
                            icon="lock"
                            label="Mật khẩu"
                            placeholder="Nhập mật khẩu"
                            isPassword={true}
                            rules={{ required: 'Vui lòng nhập mật khẩu' }}
                            rightElement={
                                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                    <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '500' }}>Quên mật khẩu?</Text>
                                </TouchableOpacity>
                            }
                        />

                        <View style={{ marginTop: 8 }}>
                            {/* Khi bấm nút -> gọi handleSubmit(handleLogin) của react-hook-form */}
                            <AuthButton
                                title="Đăng nhập"
                                onPress={handleSubmit(handleLogin)}
                                loading={loading}
                                icon={<FontAwesome5 name="sign-in-alt" size={16} color="white" />}
                            />
                        </View>
                    </View>

                    <AuthDivider text="hoặc tiếp tục với" />

                    {/* Google Button */}
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB',
                            height: 50, borderRadius: 12, marginBottom: 24
                        }}
                        onPress={handleGoogleLogin}
                        disabled={loading}
                    >
                        <FontAwesome5 name="google" size={20} color="#DB4437" />
                        <Text style={{ marginLeft: 10, fontSize: 15, fontWeight: '500', color: '#374151' }}>
                            Đăng nhập bằng Google
                        </Text>
                    </TouchableOpacity>

                    {/* Footer */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                        <Text style={{ color: '#6B7280', fontSize: 14 }}>Chưa có tài khoản? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 14 }}>Đăng ký ngay</Text>
                        </TouchableOpacity>
                    </View>

                </AuthLayout>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;