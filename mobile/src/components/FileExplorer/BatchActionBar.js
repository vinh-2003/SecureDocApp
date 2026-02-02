import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Các loại batch action có thể sử dụng
 */
export const BATCH_ACTIONS = {
    MOVE: 'move',
    DELETE: 'delete',
    RESTORE: 'restore',
    DELETE_PERMANENT: 'delete_permanent'
};

/**
 * Cấu hình cho từng loại action
 */
const ACTION_CONFIG = {
    [BATCH_ACTIONS.MOVE]: {
        label: 'Di chuyển',
        shortLabel: 'Di chuyển',
        icon: 'exchange-alt',
        color: '#6B7280',
        bgColor: 'white',
        borderColor: '#D1D5DB',
        permissionKey: 'canMove'
    },
    [BATCH_ACTIONS.DELETE]: {
        label: 'Xóa',
        shortLabel: 'Xóa',
        icon: 'trash',
        color: '#EF4444',
        bgColor: 'white',
        borderColor: '#FCA5A5',
        permissionKey: 'canDelete'
    },
    [BATCH_ACTIONS.RESTORE]: {
        label: 'Khôi phục',
        shortLabel: 'Phục hồi',
        icon: 'undo',
        color: '#10B981',
        bgColor: 'white',
        borderColor: '#6EE7B7',
        permissionKey: 'canRestore'
    },
    [BATCH_ACTIONS.DELETE_PERMANENT]: {
        label: 'Xóa vĩnh viễn',
        shortLabel: 'Xóa',
        icon: 'ban',
        color: 'white',
        bgColor: '#EF4444',
        borderColor: '#EF4444',
        permissionKey: 'canDeletePermanently'
    }
};

/**
 * Component hiển thị thanh hành động hàng loạt
 */
const BatchActionBar = ({
    selectedCount = 0,
    selectedFiles = [],
    onClearSelection,
    onAction,
    actions,
    variant = 'default',
    compact = true, // Sử dụng label ngắn
    // Legacy props
    onClear,
    onDelete,
    onMove,
    onRestore,
    onDeletePermanent
}) => {
    // Không hiển thị nếu không có item nào được chọn
    if (selectedCount === 0) return null;

    // Xác định danh sách actions dựa trên variant hoặc prop
    const actionList = useMemo(() => {
        if (actions) return actions;
        
        if (variant === 'trash') {
            return [BATCH_ACTIONS.RESTORE, BATCH_ACTIONS.DELETE_PERMANENT];
        }
        
        return [BATCH_ACTIONS.MOVE, BATCH_ACTIONS.DELETE];
    }, [actions, variant]);

    // Kiểm tra quyền cho từng action
    const canPerformAction = useMemo(() => {
        const result = {};

        actionList.forEach(actionType => {
            const config = ACTION_CONFIG[actionType];
            if (!config || !config.permissionKey) {
                result[actionType] = true;
                return;
            }

            if (!selectedFiles || selectedFiles.length === 0) {
                result[actionType] = true;
                return;
            }

            const allHavePermission = selectedFiles.every(file => {
                if (!file.permissions) return true;
                const permission = file.permissions[config.permissionKey];
                return permission !== false;
            });

            result[actionType] = allHavePermission;
        });

        return result;
    }, [actionList, selectedFiles]);

    // Xử lý clear selection
    const handleClear = () => {
        if (onClearSelection) {
            onClearSelection();
        } else if (onClear) {
            onClear();
        }
    };

    // Xử lý action
    const handleAction = (actionType) => {
        if (onAction) {
            onAction(actionType);
            return;
        }

        switch (actionType) {
            case BATCH_ACTIONS.MOVE:
                onMove?.();
                break;
            case BATCH_ACTIONS.DELETE:
                onDelete?.();
                break;
            case BATCH_ACTIONS.RESTORE:
                onRestore?.();
                break;
            case BATCH_ACTIONS.DELETE_PERMANENT:
                onDeletePermanent?.();
                break;
        }
    };

    // Lọc chỉ lấy những actions được phép
    const visibleActions = actionList.filter(actionType => canPerformAction[actionType]);

    // Style dựa trên variant
    const barStyles = variant === 'trash'
        ? { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }
        : { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' };

    const countColor = variant === 'trash' ? '#991B1B' : '#1E40AF';
    const clearColor = variant === 'trash' ? '#DC2626' : '#2563EB';

    return (
        <View style={[styles.container, barStyles]}>
            {/* Left: Count + Clear */}
            <View style={styles.leftSection}>
                <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={handleClear}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <FontAwesome5 name="times" size={14} color={clearColor} />
                </TouchableOpacity>
                <Text style={[styles.countText, { color: countColor }]}>
                    {selectedCount}
                </Text>
            </View>

            {/* Right: Action Buttons */}
            <View style={styles.actionsSection}>
                {visibleActions.length === 0 ? (
                    <Text style={styles.noActionText}>Không thể thao tác</Text>
                ) : (
                    visibleActions.map((actionType) => {
                        const config = ACTION_CONFIG[actionType];
                        if (!config) return null;

                        const isPrimary = actionType === BATCH_ACTIONS.DELETE_PERMANENT;
                        const label = compact ? config.shortLabel : config.label;

                        return (
                            <TouchableOpacity
                                key={actionType}
                                style={[
                                    styles.actionButton,
                                    {
                                        backgroundColor: config.bgColor,
                                        borderColor: config.borderColor
                                    },
                                    isPrimary && styles.actionButtonPrimary
                                ]}
                                onPress={() => handleAction(actionType)}
                                activeOpacity={0.7}
                            >
                                <FontAwesome5 
                                    name={config.icon} 
                                    size={14} 
                                    color={config.color} 
                                />
                                <Text style={[
                                    styles.actionButtonText,
                                    { color: config.color }
                                ]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 34 : 20,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    clearButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    countText: {
        fontSize: 14,
        fontWeight: '700'
    },
    actionsSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1
    },
    actionButtonPrimary: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600'
    },
    noActionText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontStyle: 'italic'
    }
});

export default BatchActionBar;