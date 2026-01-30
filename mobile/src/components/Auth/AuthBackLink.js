import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const AuthBackLink = ({ onPress, text = 'Quay lại Đăng nhập' }) => {
    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <View style={styles.content}>
                <FontAwesome5 name="arrow-left" size={12} color="#6B7280" />
                <Text style={styles.text}>{text}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        alignItems: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    text: {
        marginLeft: 8,
        color: '#6B7280', // gray-500
        fontSize: 14,
        fontWeight: '500',
    },
});

export default AuthBackLink;