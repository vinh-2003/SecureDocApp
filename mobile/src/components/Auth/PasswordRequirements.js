import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/? ]/;

const PasswordRequirements = ({ password = '', show = true }) => {
    const requirements = useMemo(() => [
        { id: 'minLength', label: 'Ít nhất 8 ký tự', test: (pwd) => pwd.length >= 8 },
        { id: 'hasLowercase', label: 'Có chữ cái thường (a-z)', test: (pwd) => /[a-z]/.test(pwd) },
        { id: 'hasUppercase', label: 'Có chữ cái hoa (A-Z)', test: (pwd) => /[A-Z]/.test(pwd) },
        { id: 'hasNumber', label: 'Có chữ số (0-9)', test: (pwd) => /[0-9]/.test(pwd) },
        { id: 'hasSpecial', label: 'Có ký tự đặc biệt', test: (pwd) => SPECIAL_CHAR_REGEX.test(pwd) }
    ], []);

    const results = useMemo(() => {
        return requirements.map(req => ({ ...req, passed: req.test(password) }));
    }, [requirements, password]);

    const passedCount = results.filter(r => r.passed).length;
    const allPassed = passedCount === requirements.length;

    if (!show) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Yêu cầu mật khẩu</Text>
                <Text style={[styles.headerCount, allPassed ? styles.textSuccess : styles.textGray]}>
                    {passedCount}/{requirements.length}
                </Text>
            </View>

            <View style={styles.list}>
                {results.map((req) => (
                    <RequirementItem
                        key={req.id}
                        label={req.label}
                        passed={req.passed}
                        hasInput={password.length > 0}
                    />
                ))}
            </View>

            {allPassed && password.length > 0 && (
                <View style={styles.successMessage}>
                    <FontAwesome5 name="check" size={10} color="#10B981" />
                    <Text style={styles.successText}>Mật khẩu hợp lệ!</Text>
                </View>
            )}
        </View>
    );
};

const RequirementItem = ({ label, passed, hasInput }) => {
    let iconName = "circle";
    let iconColor = "#9CA3AF"; // Gray
    let textColor = "#6B7280";

    if (hasInput) {
        if (passed) {
            iconName = "check";
            iconColor = "#10B981"; // Green
            textColor = "#059669";
        } else {
            iconName = "times";
            iconColor = "#EF4444"; // Red
            textColor = "#DC2626";
        }
    }

    return (
        <View style={styles.item}>
            <View style={{ width: 16, alignItems: 'center' }}>
                <FontAwesome5 name={iconName} size={10} color={iconColor} />
            </View>
            <Text style={[styles.itemText, { color: textColor }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    headerTitle: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
    headerCount: { fontSize: 12, fontWeight: '600' },
    textSuccess: { color: '#059669' },
    textGray: { color: '#9CA3AF' },
    list: { gap: 4 },
    item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    itemText: { fontSize: 12 },
    successMessage: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    successText: { fontSize: 12, color: '#059669', fontWeight: '500' }
});

export default PasswordRequirements;