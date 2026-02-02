import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Config màu sắc cho từng type
 */
const TYPE_CONFIG = {
    folder: { icon: 'folder-open', color: '#9CA3AF', bgColor: '#F3F4F6' },
    shared: { icon: 'share-alt', color: '#7C3AED', bgColor: '#EDE9FE' },
    recent: { icon: 'clock', color: '#059669', bgColor: '#D1FAE5' },
    trash: { icon: 'trash', color: '#DC2626', bgColor: '#FEE2E2' },
    search: { icon: 'search', color: '#3B82F6', bgColor: '#DBEAFE' },
    requests: { icon: 'user-shield', color: '#F59E0B', bgColor: '#FEF3C7' },
    activities: { icon: 'history', color: '#6366F1', bgColor: '#E0E7FF' }
};

const EmptyState = ({
    type = 'folder',
    icon,
    title = 'Không có dữ liệu',
    subtitle = '',
    iconColor,
    showIcon = true
}) => {
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.folder;

    // Cho phép override
    const finalIcon = icon || config.icon;
    const finalColor = iconColor || config.color;

    return (
        <View style={styles.container}>
            {showIcon && (
                <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
                    <FontAwesome5 name={finalIcon} size={40} color={finalColor} />
                </View>
            )}
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 60
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20
    }
});

export default EmptyState;