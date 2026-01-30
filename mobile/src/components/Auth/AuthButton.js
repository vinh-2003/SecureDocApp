import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';

const AuthButton = ({
    title,
    onPress,
    loading = false,
    disabled = false,
    icon // Component Icon nếu cần
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                (loading || disabled) && styles.disabledButton
            ]}
            onPress={onPress}
            disabled={loading || disabled}
            activeOpacity={0.8}
        >
            {loading ? (
                <View style={styles.content}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.text}> Đang xử lý...</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
                    <Text style={styles.text}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#2563EB', // blue-600
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.7,
        backgroundColor: '#60A5FA',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AuthButton;