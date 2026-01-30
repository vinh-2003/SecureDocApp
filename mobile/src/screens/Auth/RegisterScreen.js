import React from 'react';
import { View, TouchableOpacity, Text, KeyboardAvoidingView, ScrollView, Platform, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import AuthLayout from '../../components/Auth/AuthLayout';
import AuthInput from '../../components/Auth/AuthInput';
import AuthButton from '../../components/Auth/AuthButton';
import AuthDivider from '../../components/Auth/AuthDivider';
import PasswordStrength from '../../components/Auth/PasswordStrength';
import PasswordRequirements from '../../components/Auth/PasswordRequirements';

import useRegister from '../../hooks/useRegister';

const RegisterScreen = ({ navigation }) => {
    const { control, handleSubmit, loading, handleRegister, password, validationRules } = useRegister(navigation);

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <AuthLayout
                    title="Tạo tài khoản mới"
                    subtitle="Đăng ký để bắt đầu quản lý tài liệu an toàn"
                >
                    <View>
                        {/* 1. Họ và tên */}
                        <AuthInput
                            control={control}
                            name="fullName"
                            icon="id-card"
                            label="Họ và tên"
                            placeholder="Nguyễn Văn A"
                            rules={validationRules.fullName}
                        />

                        {/* 2. Tên đăng nhập */}
                        <AuthInput
                            control={control}
                            name="username"
                            icon="user"
                            label="Tên đăng nhập"
                            placeholder="username123"
                            rules={validationRules.username}
                        />

                        {/* 3. Email */}
                        <AuthInput
                            control={control}
                            name="email"
                            icon="envelope"
                            label="Email"
                            placeholder="example@gmail.com"
                            rules={validationRules.email}
                        />

                        {/* 4. Mật khẩu */}
                        <View>
                            <AuthInput
                                control={control}
                                name="password"
                                icon="lock"
                                label="Mật khẩu"
                                placeholder="Nhập mật khẩu"
                                isPassword={true}
                                rules={validationRules.password}
                            />

                            {/* Component UI: Yêu cầu & Độ mạnh mật khẩu */}
                            <PasswordRequirements password={password} />
                            <PasswordStrength password={password} />
                        </View>

                        {/* 5. Nhập lại mật khẩu */}
                        <View style={{ marginTop: 16 }}>
                            <AuthInput
                                control={control}
                                name="confirmPassword"
                                icon="check-circle"
                                label="Xác nhận mật khẩu"
                                placeholder="Nhập lại mật khẩu"
                                isPassword={true}
                                rules={validationRules.confirmPassword}
                            />
                        </View>

                        {/* Điều khoản */}
                        <View style={styles.termsContainer}>
                            <Text style={styles.termsText}>
                                Bằng việc đăng ký, bạn đồng ý với{' '}
                                <Text style={styles.link}>Điều khoản sử dụng</Text> và{' '}
                                <Text style={styles.link}>Chính sách bảo mật</Text> của chúng tôi.
                            </Text>
                        </View>

                        {/* Nút đăng ký */}
                        <View style={{ marginTop: 8 }}>
                            <AuthButton
                                title="Đăng ký tài khoản"
                                onPress={handleSubmit(handleRegister)}
                                loading={loading}
                                icon={<FontAwesome5 name="user-plus" size={16} color="white" />}
                                style={{ backgroundColor: '#10B981' }} // Màu xanh lá giống bản Web
                            />
                        </View>
                    </View>

                    <AuthDivider text="Đã có tài khoản?" />

                    {/* Footer - Quay lại đăng nhập */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 16 }}>Đăng nhập ngay</Text>
                        </TouchableOpacity>
                    </View>

                </AuthLayout>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    termsContainer: {
        marginVertical: 16,
        paddingHorizontal: 10
    },
    termsText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18
    },
    link: {
        color: '#2563EB',
        textDecorationLine: 'underline'
    }
});

export default RegisterScreen;