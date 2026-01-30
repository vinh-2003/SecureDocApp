import React from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <LinearGradient
            // Tương đương bg-gradient-to-br from-blue-50 via-white to-indigo-50
            colors={['#eff6ff', '#ffffff', '#eef2ff']}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.contentContainer}>

                    {/* Logo (Thay thế AppLogo) */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <FontAwesome5 name="folder-open" size={32} color="#2563EB" />
                        </View>
                    </View>

                    {/* Card */}
                    <View style={styles.card}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.subtitle}>{subtitle}</Text>
                        </View>

                        {/* Content (Form) */}
                        <View style={styles.body}>
                            {children}
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(37, 99, 235, 0.1)', // blue-100 opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        paddingVertical: 20,
        // Shadow tương đương shadow-xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937', // gray-800
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280', // gray-500
        textAlign: 'center',
    },
    body: {
        paddingHorizontal: 20,
    },
});

export default AuthLayout;