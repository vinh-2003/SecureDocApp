import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Hooks
import useAccessRequest from '../../hooks/useAccessRequest';

const RequestAccessModal = ({
    visible,
    onClose,
    fileId,
    pages = [],
    onSuccess
}) => {
    // Sử dụng hook
    const {
        selectedPages,
        reason,
        loading,
        lockedPages,
        hasLockedPages,
        selectedCount,
        isAllSelected,
        setReason,
        togglePage,
        selectAll,
        deselectAll,
        submit,
        reset
    } = useAccessRequest(fileId, pages, visible, onSuccess);

    // Handle submit
    const handleSubmit = async () => {
        const success = await submit();
        if (success) {
            onClose();
        }
    };

    // Handle close
    const handleClose = () => {
        if (!loading) {
            reset();
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIcon}>
                                <FontAwesome5 name="unlock-alt" size={16} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Yêu cầu mở khóa</Text>
                                <Text style={styles.headerSubtitle}>
                                    Gửi yêu cầu xem các trang bị khóa
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleClose} disabled={loading}>
                            <FontAwesome5 name="times" size={18} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        {/* Page Selector */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionLabel}>
                                    Chọn các trang bạn muốn xem{' '}
                                    <Text style={styles.selectedCount}>({selectedCount} đã chọn)</Text>
                                </Text>
                                {hasLockedPages && (
                                    <TouchableOpacity
                                        onPress={isAllSelected ? deselectAll : selectAll}
                                    >
                                        <Text style={styles.selectAllText}>
                                            {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {hasLockedPages ? (
                                <View style={styles.pagesGrid}>
                                    {lockedPages.map((page) => {
                                        const isSelected = selectedPages.includes(page.pageIndex);
                                        return (
                                            <TouchableOpacity
                                                key={page.id}
                                                style={[
                                                    styles.pageItem,
                                                    isSelected && styles.pageItemSelected
                                                ]}
                                                onPress={() => togglePage(page.pageIndex)}
                                            >
                                                <Text style={[
                                                    styles.pageItemText,
                                                    isSelected && styles.pageItemTextSelected
                                                ]}>
                                                    Trang {page.pageIndex + 1}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ) : (
                                <Text style={styles.emptyText}>
                                    Không có trang nào cần mở khóa
                                </Text>
                            )}
                        </View>

                        {/* Reason Input */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>
                                Lý do xin quyền <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.textInput}
                                value={reason}
                                onChangeText={setReason}
                                placeholder="VD: Em cần tài liệu này để làm đồ án..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={3}
                                maxLength={500}
                                textAlignVertical="top"
                            />
                            <Text style={styles.charCount}>
                                {reason.length}/500
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (loading || !hasLockedPages) && styles.buttonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={loading || !hasLockedPages}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <FontAwesome5 name="check" size={12} color="#fff" />
                                    <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },
    body: {
        padding: 20
    },
    section: {
        marginBottom: 20
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151'
    },
    selectedCount: {
        color: '#3B82F6'
    },
    selectAllText: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '500'
    },
    required: {
        color: '#EF4444'
    },
    pagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    pageItem: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#fff'
    },
    pageItemSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6'
    },
    pageItemText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500'
    },
    pageItemTextSelected: {
        color: '#fff'
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 13,
        paddingVertical: 20
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: '#1F2937',
        minHeight: 80
    },
    charCount: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center'
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280'
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#3B82F6'
    },
    submitButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff'
    },
    buttonDisabled: {
        opacity: 0.5
    }
});

export default RequestAccessModal;