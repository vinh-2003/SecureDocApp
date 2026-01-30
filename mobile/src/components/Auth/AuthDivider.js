import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AuthDivider = ({ text = 'hoặc' }) => {
    return (
        <View style={styles.container}>
            <View style={styles.line} />
            <Text style={styles.text}>{text}</Text>
            <View style={styles.line} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB', // gray-200
    },
    text: {
        marginHorizontal: 10,
        color: '#9CA3AF', // gray-400
        fontSize: 12,
        textTransform: 'uppercase',
    },
});

export default AuthDivider;