import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const LockedPageOverlay = ({ onRequestAccess }) => {
    return (
        <View style={styles.overlay}>
            <View style={styles.card}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <FontAwesome5 name="lock" size={28} color="#EF4444" />
                </View>

                {/* Text */}
                <Text style={styles.title}>Trang bị giới hạn</Text>
                <Text style={styles.subtitle}>
                    Bạn cần yêu cầu quyền truy cập từ chủ sở hữu để xem nội dung trang này.
                </Text>

                {/* Button */}
                <TouchableOpacity
                    style={styles.requestButton}
                    onPress={onRequestAccess}
                    activeOpacity={0.8}
                >
                    <FontAwesome5 name="unlock-alt" size={14} color="#fff" />
                    <Text style={styles.requestButtonText}>Gửi yêu cầu mở khóa</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20
    },
    requestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    requestButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600'
    }
});

export default LockedPageOverlay;