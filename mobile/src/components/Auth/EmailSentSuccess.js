import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const EmailSentSuccess = ({
    email,
    title = 'Kiểm tra email của bạn',
    description,
    onResend,
    onBack,
    loading = false
}) => {
    const defaultDesc = `Chúng tôi đã gửi link đặt lại mật khẩu đến địa chỉ email ${email}. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác).`;

    return (
        <View style={styles.container}>
            {/* Icon Circle */}
            <View style={styles.iconContainer}>
                <FontAwesome5 name="envelope" size={32} color="#10B981" />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Description */}
            <Text style={styles.description}>
                {description || defaultDesc}
            </Text>

            {/* Email Highlight Box */}
            <View style={styles.emailBox}>
                <Text style={styles.emailLabel}>Email đã gửi đến:</Text>
                <Text style={styles.emailText}>{email}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                {onResend && (
                    <TouchableOpacity
                        onPress={onResend}
                        disabled={loading}
                        style={styles.resendButton}
                    >
                        {loading ? (
                            <Text style={styles.resendText}>Đang gửi...</Text>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <FontAwesome5 name="redo" size={12} color="#374151" style={{ marginRight: 8 }} />
                                <Text style={styles.resendText}>Gửi lại email</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}

                {onBack && (
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <FontAwesome5 name="arrow-left" size={12} color="#6B7280" style={{ marginRight: 8 }} />
                        <Text style={styles.backText}>Sử dụng email khác</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#D1FAE5', // green-100
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937', // gray-800
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#6B7280', // gray-500
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    emailBox: {
        width: '100%',
        backgroundColor: '#F9FAFB', // gray-50
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        alignItems: 'center',
    },
    emailLabel: {
        fontSize: 13,
        color: '#4B5563',
        marginBottom: 4,
    },
    emailText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    resendButton: {
        width: '100%',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    backButton: {
        width: '100%',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: {
        fontSize: 14,
        color: '#6B7280',
    },
});

export default EmailSentSuccess;