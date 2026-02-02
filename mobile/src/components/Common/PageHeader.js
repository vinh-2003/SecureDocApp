import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PageHeader = ({ title, subtitle, rightComponent }) => {
    return (
        <View style={styles.container}>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {/* Nơi để đặt các nút hành động bên phải (nếu cần) */}
            {rightComponent && (
                <View style={styles.rightContainer}>
                    {rightComponent}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB', // Màu xám nhẹ ngăn cách
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827', // Gray-900
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280', // Gray-500
        marginTop: 4,
    },
    rightContainer: {
        marginLeft: 16,
    }
});

export default PageHeader;