import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

const PasswordStrength = ({ password = '' }) => {
    const strength = useMemo(() => {
        if (!password) return { score: 0, label: '', color: 'transparent', bgColor: '#E5E7EB' };

        let score = 0;
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (SPECIAL_CHAR_REGEX.test(password)) score += 1;

        if (score <= 2) {
            return { score: 1, label: 'Yếu', color: '#EF4444', bgColor: '#EF4444' }; // Red
        } else if (score <= 3) {
            return { score: 2, label: 'Trung bình', color: '#F59E0B', bgColor: '#F59E0B' }; // Yellow
        } else if (score <= 4) {
            return { score: 3, label: 'Khá', color: '#3B82F6', bgColor: '#3B82F6' }; // Blue
        } else {
            return { score: 4, label: 'Mạnh', color: '#10B981', bgColor: '#10B981' }; // Green
        }
    }, [password]);

    if (!password) return null;

    return (
        <View style={styles.container}>
            {/* Bars */}
            <View style={styles.barContainer}>
                {[1, 2, 3, 4].map((level) => (
                    <View
                        key={level}
                        style={[
                            styles.bar,
                            {
                                backgroundColor: level <= strength.score ? strength.bgColor : '#E5E7EB',
                                flex: 1
                            }
                        ]}
                    />
                ))}
            </View>

            {/* Label */}
            <View style={styles.labelContainer}>
                <FontAwesome5 name="shield-alt" size={12} color={strength.color} />
                <Text style={[styles.text, { color: strength.color }]}>
                    Độ mạnh: <Text style={{ fontWeight: 'bold' }}>{strength.label}</Text>
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginTop: 8, marginBottom: 8 },
    barContainer: {
        flexDirection: 'row',
        gap: 4, // React Native mới hỗ trợ gap, nếu lỗi dùng marginRight
        marginBottom: 6,
        height: 6,
    },
    bar: {
        height: '100%',
        borderRadius: 3,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    text: {
        fontSize: 12,
        marginLeft: 6,
    },
});

export default PasswordStrength;