import React from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import AuthLayout from '../../components/Auth/AuthLayout';
import AuthInput from '../../components/Auth/AuthInput';
import AuthButton from '../../components/Auth/AuthButton';
import AuthBackLink from '../../components/Auth/AuthBackLink';
import EmailSentSuccess from '../../components/Auth/EmailSentSuccess';

import useForgotPassword from '../../hooks/useForgotPassword';

const ForgotPasswordScreen = ({ navigation }) => {
    const {
        control,
        loading,
        emailSent,
        sentEmail,
        validationRules,
        handleSubmit,
        handleSendEmail,
        handleResend,
        handleReset
    } = useForgotPassword();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <AuthLayout
                    title={emailSent ? undefined : 'Quên mật khẩu?'}
                    subtitle={emailSent ? undefined : 'Nhập email của bạn để nhận link đặt lại mật khẩu'}
                >
                    {emailSent ? (
                        // === TRẠNG THÁI 2: ĐÃ GỬI EMAIL ===
                        <EmailSentSuccess
                            email={sentEmail}
                            onResend={handleResend}
                            onBack={handleReset}
                            loading={loading}
                        />
                    ) : (
                        // === TRẠNG THÁI 1: FORM NHẬP EMAIL ===
                        <View>
                            {/* Email Input */}
                            <AuthInput
                                control={control}
                                name="email"
                                icon="envelope"
                                label="Email đã đăng ký"
                                placeholder="example@gmail.com"
                                rules={validationRules.email}
                            />

                            {/* Hint Text */}
                            <Text style={styles.hintText}>
                                Chúng tôi sẽ gửi link đặt lại mật khẩu vào email này.
                                Link có hiệu lực trong 24 giờ.
                            </Text>

                            {/* Submit Button */}
                            <View style={{ marginTop: 16 }}>
                                <AuthButton
                                    title="Gửi link xác nhận"
                                    onPress={handleSubmit(handleSendEmail)}
                                    loading={loading}
                                    icon={<FontAwesome5 name="paper-plane" size={14} color="white" />}
                                />
                            </View>

                            {/* Back Link */}
                            <AuthBackLink
                                onPress={() => navigation.navigate('Login')}
                                text="Quay lại Đăng nhập"
                            />
                        </View>
                    )}
                </AuthLayout>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    hintText: {
        fontSize: 12,
        color: '#6B7280', // gray-500
        lineHeight: 18,
        marginBottom: 8,
    },
});

export default ForgotPasswordScreen;