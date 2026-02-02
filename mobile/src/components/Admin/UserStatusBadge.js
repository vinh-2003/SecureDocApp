import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UserStatusBadge = ({ user }) => {
    let bg, color, text, border;

    if (!user.enabled) {
        bg = '#F3F4F6'; // Gray-100
        color = '#1F2937'; // Gray-800
        border = '#E5E7EB';
        text = 'Chưa kích hoạt';
    } else if (!user.accountNonLocked) {
        if (user.lockTime) {
            bg = '#FFEDD5'; // Orange-100
            color = '#9A3412'; // Orange-800
            border = '#FED7AA';
            text = 'Tạm khóa';
        } else {
            bg = '#FEE2E2'; // Red-100
            color = '#991B1B'; // Red-800
            border = '#FECACA';
            text = 'Vô hiệu hóa';
        }
    } else {
        bg = '#D1FAE5'; // Green-100
        color = '#065F46'; // Green-800
        border = '#A7F3D0';
        text = 'Hoạt động';
    }

    return (
        <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
            <Text style={[styles.text, { color: color }]}>{text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        alignSelf: 'flex-start'
    },
    text: {
        fontSize: 10,
        fontWeight: '600'
    }
});

export default UserStatusBadge;