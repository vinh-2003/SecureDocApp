import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Controller } from 'react-hook-form'; // [QUAN TRỌNG]

const AuthInput = ({
    control, // Nhận control từ hook
    name,    // Tên field (username/password)
    rules,   // Validate rules (required...)
    label,
    placeholder,
    icon,
    isPassword = false,
    rightElement
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    return (
        // Dùng Controller để bọc TextInput
        <Controller
            control={control}
            name={name}
            rules={rules}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <View style={styles.container}>
                    {(label || rightElement) && (
                        <View style={styles.labelContainer}>
                            {label && <Text style={styles.label}>{label}</Text>}
                            {rightElement}
                        </View>
                    )}

                    <View style={[
                        styles.inputWrapper,
                        isFocused && styles.inputWrapperFocus,
                        error && styles.inputWrapperError // Tự động check lỗi
                    ]}>
                        {icon && (
                            <FontAwesome5 name={icon} size={16} color="#9CA3AF" style={styles.iconLeft} />
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder={placeholder}
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry={isPassword && !showPassword}

                            // [QUAN TRỌNG] Binding dữ liệu từ React Hook Form
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}

                            onFocus={() => setIsFocused(true)}
                            autoCapitalize="none"
                        />

                        {isPassword && (
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Hiển thị lỗi tự động */}
                    {error && (
                        <Text style={styles.errorText}>⚠ {error.message}</Text>
                    )}
                </View>
            )}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151', // gray-700
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB', // gray-200
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        backgroundColor: '#F9FAFB', // gray-50
    },
    inputWrapperFocus: {
        borderColor: '#3B82F6', // blue-500
        backgroundColor: '#fff',
        borderWidth: 1.5,
    },
    inputWrapperError: {
        borderColor: '#EF4444', // red-500
        backgroundColor: '#FEF2F2',
    },
    iconLeft: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        color: '#1F2937',
        fontSize: 15,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
    },
});

export default AuthInput;