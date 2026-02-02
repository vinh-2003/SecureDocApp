import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import CustomModal from '../Common/CustomModal';

/**
 * Modal xác nhận gỡ quyền truy cập
 * Đồng bộ với ConfirmRevokeModal.jsx trên Web
 * 
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {Function} onClose - Callback đóng modal
 * @param {Function} onConfirm - Callback khi xác nhận
 * @param {Object} user - User đang được gỡ quyền
 * @param {boolean} loading - Trạng thái loading
 */
const ConfirmRevokeModal = ({
    isOpen,
    onClose,
    onConfirm,
    user,
    loading = false
}) => {
    if (!isOpen || !user) return null;

    return (
        <CustomModal visible={isOpen} onClose={onClose}>
            {/* Thanh màu đỏ ở trên */}
            <View style={styles.redBar} />
            
            {/* Content */}
            <View style={styles.content}>
                {/* Icon và Text */}
                <View style={styles.mainContent}>
                    {/* Icon cảnh báo */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <FontAwesome5 name="exclamation-triangle" size={24} color="#EF4444" />
                        </View>
                    </View>

                    {/* Text content */}
                    <View style={styles.textContent}>
                        <Text style={styles.title}>Ngừng chia sẻ?</Text>
                        
                        <Text style={styles.message}>
                            Bạn có chắc chắn muốn gỡ bỏ quyền truy cập của{' '}
                            <Text style={styles.emailHighlight}>{user.email}</Text> không?
                        </Text>
                        
                        <Text style={styles.subMessage}>
                            Họ sẽ không còn xem hoặc chỉnh sửa được tài liệu này nữa.
                        </Text>
                    </View>
                </View>

                {/* Nút hành động */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                        disabled={loading}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.confirmButton, loading && styles.buttonDisabled]}
                        onPress={onConfirm}
                        disabled={loading}
                        activeOpacity={0.7}
                    >
                        {loading ? (
                            <View style={styles.loadingContent}>
                                <ActivityIndicator size="small" color="white" />
                                <Text style={styles.confirmButtonText}>Đang xử lý...</Text>
                            </View>
                        ) : (
                            <Text style={styles.confirmButtonText}>Đồng ý gỡ bỏ</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    redBar: {
        height: 4,
        backgroundColor: '#EF4444',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        marginTop: -20,
        marginHorizontal: -20,
        marginBottom: 20
    },
    content: {
        paddingTop: 4
    },
    mainContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24
    },
    iconContainer: {
        marginRight: 16
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center'
    },
    textContent: {
        flex: 1
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8
    },
    message: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20
    },
    emailHighlight: {
        fontWeight: 'bold',
        color: '#1F2937'
    },
    subMessage: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 8,
        lineHeight: 18
    },
    actions: {
        flexDirection: 'row',
        gap: 12
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151'
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3
    },
    buttonDisabled: {
        opacity: 0.6
    },
    confirmButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white'
    },
    loadingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    }
});

export default ConfirmRevokeModal;