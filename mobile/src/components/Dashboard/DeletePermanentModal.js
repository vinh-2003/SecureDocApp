import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import CustomModal from '../Common/CustomModal';

/**
 * Modal xác nhận xóa vĩnh viễn
 */
const DeletePermanentModal = ({
    isOpen,
    onClose,
    onConfirm,
    count = 0,
    loading = false
}) => {
    if (!isOpen) return null;

    return (
        <CustomModal visible={isOpen} onClose={onClose}>
            <View style={styles.container}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <FontAwesome5 name="exclamation-triangle" size={32} color="#DC2626" />
                </View>

                {/* Title */}
                <Text style={styles.title}>Xóa vĩnh viễn?</Text>

                {/* Message */}
                <Text style={styles.message}>
                    Bạn có chắc chắn muốn xóa vĩnh viễn{' '}
                    <Text style={styles.highlight}>{count} mục</Text>?
                </Text>

                <Text style={styles.warning}>
                    Hành động này không thể hoàn tác. Các tệp sẽ bị xóa hoàn toàn khỏi hệ thống.
                </Text>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                        disabled={loading}
                    >
                        <Text style={styles.cancelButtonText}>Hủy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.deleteButton, loading && styles.buttonDisabled]}
                        onPress={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <FontAwesome5 name="ban" size={14} color="white" />
                                <Text style={styles.deleteButtonText}>Xóa vĩnh viễn</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center'
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12
    },
    message: {
        fontSize: 15,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 8
    },
    highlight: {
        fontWeight: '700',
        color: '#DC2626'
    },
    warning: {
        fontSize: 13,
        color: '#DC2626',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 24,
        paddingHorizontal: 8
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%'
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center'
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151'
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center'
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'white'
    },
    buttonDisabled: {
        opacity: 0.7
    }
});

export default DeletePermanentModal;