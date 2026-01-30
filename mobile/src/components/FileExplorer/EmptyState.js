import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const CONFIGS = {
    folder: { icon: 'folder-open', text: 'Thư mục trống' },
    search: { icon: 'search', text: 'Không tìm thấy kết quả' },
    recent: { icon: 'clock', text: 'Chưa có hoạt động gần đây' },
    trash: { icon: 'trash', text: 'Thùng rác trống' },
    default: { icon: 'file', text: 'Không có dữ liệu' }
};

const EmptyState = ({ type = 'default', message }) => {
    const config = CONFIGS[type] || CONFIGS.default;

    return (
        <View style={styles.container}>
            <View style={styles.iconCircle}>
                <FontAwesome5 name={config.icon} size={40} color="#9CA3AF" />
            </View>
            <Text style={styles.text}>{message || config.text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', padding: 40 },
    iconCircle: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16
    },
    text: { color: '#6B7280', fontSize: 16, fontWeight: '500' }
});

export default EmptyState;