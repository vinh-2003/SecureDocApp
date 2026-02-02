import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { FontAwesome5 } from '@expo/vector-icons';

// Services
import userService from '../../services/userService';

// Components
import PasswordRequirements from '../../components/Auth/PasswordRequirements';
import PasswordStrength from '../../components/Auth/PasswordStrength';

// Regex đồng bộ với PasswordRequirements
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/? ]/;

const ChangePasswordScreen = ({ navigation }) => {
    // =========================================================================
    // STATE
    // =========================================================================
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // =========================================================================
    // VALIDATION
    // =========================================================================
    const validateCurrentPassword = (value) => {
        if (!value || !value.trim()) {
            return 'Vui lòng nhập mật khẩu hiện tại';
        }
        return null;
    };

    const validateNewPassword = (value) => {
        if (!value || !value.trim()) {
            return 'Vui lòng nhập mật khẩu mới';
        }
        if (value.length < 8) {
            return 'Mật khẩu phải có ít nhất 8 ký tự';
        }
        if (!/[a-z]/.test(value)) {
            return 'Thiếu chữ thường (a-z)';
        }
        if (!/[A-Z]/.test(value)) {
            return 'Thiếu chữ hoa (A-Z)';
        }
        if (!/[0-9]/.test(value)) {
            return 'Thiếu số (0-9)';
        }
        if (!SPECIAL_CHAR_REGEX.test(value)) {
            return 'Thiếu ký tự đặc biệt';
        }
        return null;
    };

    const validateConfirmPassword = (value) => {
        if (!value || !value.trim()) {
            return 'Vui lòng xác nhận mật khẩu';
        }
        if (value !== newPassword) {
            return 'Mật khẩu xác nhận không khớp';
        }
        return null;
    };

    const validateAll = () => {
        const newErrors = {};
        
        const currentErr = validateCurrentPassword(currentPassword);
        if (currentErr) newErrors.currentPassword = currentErr;
        
        const newErr = validateNewPassword(newPassword);
        if (newErr) newErrors.newPassword = newErr;
        
        const confirmErr = validateConfirmPassword(confirmPassword);
        if (confirmErr) newErrors.confirmPassword = confirmErr;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // =========================================================================
    // HANDLERS
    // =========================================================================
    const handleSubmit = async () => {
        if (!validateAll()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await userService.changePassword({
                currentPassword: currentPassword,
                newPassword: newPassword
            });

            if (res.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Thành công',
                    text2: 'Đổi mật khẩu thành công!'
                });

                // Reset form
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setErrors({});

                // Navigate back
                navigation.goBack();
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.';
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    // =========================================================================
    // RENDER
    // =========================================================================
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <FontAwesome5 name="arrow-left" size={18} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header Card */}
                    <LinearGradient
                        colors={['#1D4ED8', '#4338CA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerCard}
                    >
                        <View style={styles.headerIconContainer}>
                            <FontAwesome5 name="shield-alt" size={24} color="#fff" />
                        </View>
                        <Text style={styles.headerCardTitle}>Bảo mật tài khoản</Text>
                        <Text style={styles.headerCardSubtitle}>
                            Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                        </Text>
                    </LinearGradient>

                    {/* Form Card */}
                    <View style={styles.formCard}>
                        {/* Current Password */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>
                                Mật khẩu hiện tại <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIconLeft}>
                                    <FontAwesome5 name="lock" size={14} color="#9CA3AF" />
                                </View>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        errors.currentPassword && styles.textInputError
                                    ]}
                                    value={currentPassword}
                                    onChangeText={(text) => {
                                        setCurrentPassword(text);
                                        if (errors.currentPassword) {
                                            setErrors(prev => ({ ...prev, currentPassword: null }));
                                        }
                                    }}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showCurrentPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    <FontAwesome5
                                        name={showCurrentPassword ? 'eye-slash' : 'eye'}
                                        size={16}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.currentPassword && (
                                <View style={styles.errorRow}>
                                    <FontAwesome5 name="exclamation-circle" size={12} color="#EF4444" />
                                    <Text style={styles.errorText}>{errors.currentPassword}</Text>
                                </View>
                            )}
                        </View>

                        {/* New Password */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>
                                Mật khẩu mới <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIconLeft}>
                                    <FontAwesome5 name="lock" size={14} color="#9CA3AF" />
                                </View>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        errors.newPassword && styles.textInputError
                                    ]}
                                    value={newPassword}
                                    onChangeText={(text) => {
                                        setNewPassword(text);
                                        if (errors.newPassword) {
                                            setErrors(prev => ({ ...prev, newPassword: null }));
                                        }
                                    }}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showNewPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <FontAwesome5
                                        name={showNewPassword ? 'eye-slash' : 'eye'}
                                        size={16}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.newPassword && (
                                <View style={styles.errorRow}>
                                    <FontAwesome5 name="exclamation-circle" size={12} color="#EF4444" />
                                    <Text style={styles.errorText}>{errors.newPassword}</Text>
                                </View>
                            )}
                        </View>

                        {/* Password Requirements & Strength */}
                        <PasswordRequirements password={newPassword} />
                        <PasswordStrength password={newPassword} />

                        {/* Confirm Password */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>
                                Xác nhận mật khẩu mới <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIconLeft}>
                                    <FontAwesome5 name="lock" size={14} color="#9CA3AF" />
                                </View>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        errors.confirmPassword && styles.textInputError
                                    ]}
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        if (errors.confirmPassword) {
                                            setErrors(prev => ({ ...prev, confirmPassword: null }));
                                        }
                                    }}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <FontAwesome5
                                        name={showConfirmPassword ? 'eye-slash' : 'eye'}
                                        size={16}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && (
                                <View style={styles.errorRow}>
                                    <FontAwesome5 name="exclamation-circle" size={12} color="#EF4444" />
                                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                                </View>
                            )}

                            {/* Match indicator */}
                            {confirmPassword.length > 0 && confirmPassword === newPassword && (
                                <View style={styles.matchRow}>
                                    <FontAwesome5 name="check-circle" size={12} color="#10B981" />
                                    <Text style={styles.matchText}>Mật khẩu khớp</Text>
                                </View>
                            )}
                        </View>

                        {/* Actions */}
                        <View style={styles.formActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancel}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    isSubmitting && styles.buttonDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <FontAwesome5 name="save" size={14} color="#fff" />
                                        <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Spacer */}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    keyboardView: {
        flex: 1
    },
    scrollView: {
        flex: 1
    },
    scrollContent: {
        padding: 16
    },

    // Header Card
    headerCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16
    },
    headerIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    headerCardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4
    },
    headerCardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center'
    },

    // Form Card
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3
    },
    fieldGroup: {
        marginBottom: 16
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8
    },
    required: {
        color: '#EF4444'
    },
    inputWrapper: {
        position: 'relative'
    },
    inputIconLeft: {
        position: 'absolute',
        left: 14,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        zIndex: 1
    },
    textInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingLeft: 42,
        paddingRight: 42,
        paddingVertical: 14,
        fontSize: 14,
        color: '#1F2937'
    },
    textInputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2'
    },
    eyeButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 44,
        justifyContent: 'center',
        alignItems: 'center'
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444'
    },
    matchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6
    },
    matchText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '500'
    },

    // Actions
    formActions: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginTop: 8
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center'
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280'
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#3B82F6'
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff'
    },
    buttonDisabled: {
        backgroundColor: '#93C5FD',
        opacity: 0.7
    }
});

export default ChangePasswordScreen;