import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { FontAwesome5 } from '@expo/vector-icons';

// Context & Services
import { AuthContext } from '../../context/AuthContext';
import userService from '../../services/userService';

// Utils
import { formatDate } from '../../utils/format';
import { getAvatarUrl, resolveUrl } from '../../utils/urlHelper';

// Components
import Header from '../../components/Header/Header';

const ProfileScreen = ({ navigation }) => {
    // =========================================================================
    // CONTEXT & STATE
    // =========================================================================
    const { user, updateUser } = useContext(AuthContext);

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [fullNameError, setFullNameError] = useState('');

    // Avatar state
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedImageAsset, setSelectedImageAsset] = useState(null);

    // =========================================================================
    // FETCH PROFILE
    // =========================================================================
    const fetchProfile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await userService.getProfile();
            if (res.success && res.data) {
                setProfile(res.data);
                setFullName(res.data.fullName || '');
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể tải thông tin tài khoản'
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // =========================================================================
    // IMAGE PICKER
    // =========================================================================
    const handlePickImage = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Toast.show({
                    type: 'error',
                    text1: 'Quyền truy cập',
                    text2: 'Cần quyền truy cập thư viện ảnh'
                });
                return;
            }

            // Launch picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                
                // Validate size (max 50MB)
                if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
                    Toast.show({
                        type: 'error',
                        text1: 'Ảnh quá lớn',
                        text2: 'Vui lòng chọn ảnh dưới 50MB'
                    });
                    return;
                }

                setPreviewImage(asset.uri);
                setSelectedImageAsset(asset);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể chọn ảnh'
            });
        }
    };

    // =========================================================================
    // VALIDATION
    // =========================================================================
    const validateFullName = (value) => {
        if (!value || !value.trim()) {
            setFullNameError('Họ tên không được để trống');
            return false;
        }
        if (value.trim().length < 2) {
            setFullNameError('Họ tên phải có ít nhất 2 ký tự');
            return false;
        }
        if (value.trim().length > 100) {
            setFullNameError('Họ tên không được quá 100 ký tự');
            return false;
        }
        setFullNameError('');
        return true;
    };

    // =========================================================================
    // HANDLERS
    // =========================================================================
    const handleCancel = () => {
        // Reset to original values
        setFullName(profile?.fullName || '');
        setFullNameError('');
        setPreviewImage(null);
        setSelectedImageAsset(null);
    };

    const handleSubmit = async () => {
        // Validate
        if (!validateFullName(fullName)) {
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('fullName', fullName.trim());

            // Append avatar if selected
            if (selectedImageAsset) {
                const fileName = selectedImageAsset.fileName || `avatar_${Date.now()}.jpg`;
                formData.append('avatar', {
                    uri: selectedImageAsset.uri,
                    type: selectedImageAsset.mimeType || 'image/jpeg',
                    name: fileName
                });
            }

            const res = await userService.updateProfile(formData);

            if (res.success && res.data) {
                Toast.show({
                    type: 'success',
                    text1: 'Thành công',
                    text2: 'Cập nhật hồ sơ thành công!'
                });

                setProfile(res.data);
                setPreviewImage(null);
                setSelectedImageAsset(null);

                // Update global user context
                if (updateUser) {
                    updateUser({
                        fullName: res.data.fullName,
                        avatarUrl: res.data.avatarUrl
                    });
                }
            }
        } catch (error) {
            console.error('Update profile error:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: error.response?.data?.message || 'Cập nhật thất bại'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check if form has changes
    const hasChanges = fullName !== (profile?.fullName || '') || selectedImageAsset !== null;

    // =========================================================================
    // RENDER
    // =========================================================================
    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <Header />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Đang tải thông tin...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Avatar URL
    const avatarUrl = previewImage || getAvatarUrl(profile);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Header />

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
                    {/* Header Cover */}
                    <LinearGradient
                        colors={['#1D4ED8', '#4338CA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerCover}
                    >
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
                            <Text style={styles.headerSubtitle}>
                                Quản lý thông tin tài khoản của bạn
                            </Text>
                        </View>
                        {/* Decorative circles */}
                        <View style={styles.decorCircle1} />
                        <View style={styles.decorCircle2} />
                    </LinearGradient>

                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        {/* Avatar */}
                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={handlePickImage}
                            activeOpacity={0.8}
                        >
                            <View style={styles.avatarWrapper}>
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={styles.avatar}
                                />
                            </View>
                            <View style={styles.cameraButton}>
                                <FontAwesome5 name="camera" size={12} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        {/* Name & Email */}
                        <Text style={styles.displayName}>
                            {profile?.fullName || profile?.username}
                        </Text>
                        <Text style={styles.email}>{profile?.email}</Text>

                        {/* Roles */}
                        {profile?.roles && profile.roles.length > 0 && (
                            <View style={styles.rolesContainer}>
                                {profile.roles.map((role, index) => (
                                    <View key={index} style={styles.roleBadge}>
                                        <FontAwesome5 name="shield-alt" size={10} color="#4F46E5" />
                                        <Text style={styles.roleBadgeText}>{role}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Meta Info */}
                        <View style={styles.metaContainer}>
                            <View style={styles.metaRow}>
                                <View style={styles.metaLabel}>
                                    <FontAwesome5 name="id-badge" size={12} color="#9CA3AF" />
                                    <Text style={styles.metaLabelText}>ID:</Text>
                                </View>
                                <Text style={styles.metaValue} numberOfLines={1}>
                                    {profile?.userId || profile?.id}
                                </Text>
                            </View>
                            <View style={styles.metaRow}>
                                <View style={styles.metaLabel}>
                                    <FontAwesome5 name="calendar-alt" size={12} color="#9CA3AF" />
                                    <Text style={styles.metaLabelText}>Tham gia:</Text>
                                </View>
                                <Text style={styles.metaValue}>
                                    {formatDate(profile?.createdAt)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Edit Form */}
                    <View style={styles.formCard}>
                        {/* Form Header */}
                        <View style={styles.formHeader}>
                            <View style={styles.formHeaderIcon}>
                                <FontAwesome5 name="edit" size={16} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.formHeaderTitle}>Cập nhật thông tin</Text>
                                <Text style={styles.formHeaderSubtitle}>
                                    Chỉnh sửa thông tin cá nhân của bạn
                                </Text>
                            </View>
                        </View>

                        {/* Account Info Section */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>THÔNG TIN TÀI KHOẢN</Text>

                            {/* Username (Read-only) */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Tên đăng nhập</Text>
                                <View style={styles.readOnlyField}>
                                    <FontAwesome5 name="user" size={14} color="#9CA3AF" />
                                    <Text style={styles.readOnlyText}>{profile?.username}</Text>
                                </View>
                            </View>

                            {/* Email (Read-only) */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Email</Text>
                                <View style={styles.readOnlyField}>
                                    <FontAwesome5 name="envelope" size={14} color="#9CA3AF" />
                                    <Text style={styles.readOnlyText}>{profile?.email}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Personal Info Section */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>THÔNG TIN CÁ NHÂN</Text>

                            {/* Full Name (Editable) */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>
                                    Họ và tên <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        fullNameError && styles.textInputError
                                    ]}
                                    value={fullName}
                                    onChangeText={(text) => {
                                        setFullName(text);
                                        if (fullNameError) validateFullName(text);
                                    }}
                                    onBlur={() => validateFullName(fullName)}
                                    placeholder="Nhập họ tên đầy đủ..."
                                    placeholderTextColor="#9CA3AF"
                                    autoCapitalize="words"
                                />
                                {fullNameError ? (
                                    <View style={styles.errorRow}>
                                        <FontAwesome5 name="exclamation-circle" size={12} color="#EF4444" />
                                        <Text style={styles.errorText}>{fullNameError}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.formActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancel}
                                disabled={isSubmitting || !hasChanges}
                            >
                                <Text style={[
                                    styles.cancelButtonText,
                                    (!hasChanges || isSubmitting) && styles.buttonTextDisabled
                                ]}>
                                    Hủy bỏ
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    (!hasChanges || isSubmitting) && styles.buttonDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={isSubmitting || !hasChanges}
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
    keyboardView: {
        flex: 1
    },
    scrollView: {
        flex: 1
    },
    scrollContent: {
        paddingBottom: 40
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280'
    },

    // Header Cover
    headerCover: {
        height: 160,
        paddingHorizontal: 20,
        paddingTop: 20,
        position: 'relative',
        overflow: 'hidden'
    },
    headerContent: {
        zIndex: 1
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff'
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4
    },
    decorCircle1: {
        position: 'absolute',
        top: -40,
        left: -40,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)'
    },
    decorCircle2: {
        position: 'absolute',
        bottom: -60,
        right: -30,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(96,165,250,0.2)'
    },

    // Profile Card
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: -60,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12
    },
    avatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        padding: 3,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#E5E7EB'
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff'
    },
    displayName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    email: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4
    },
    rolesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#C7D2FE'
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4F46E5'
    },
    metaContainer: {
        width: '100%',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    metaLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    metaLabelText: {
        fontSize: 13,
        color: '#6B7280'
    },
    metaValue: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        maxWidth: 150
    },

    // Form Card
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3
    },
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 20
    },
    formHeaderIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    formHeaderTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    formHeaderSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },
    formSection: {
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: 12
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
    readOnlyField: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14
    },
    readOnlyText: {
        flex: 1,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500'
    },
    textInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 14,
        color: '#1F2937'
    },
    textInputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2'
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

    // Actions
    formActions: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
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
    },
    buttonTextDisabled: {
        opacity: 0.5
    }
});

export default ProfileScreen;