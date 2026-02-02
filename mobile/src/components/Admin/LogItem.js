import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../../utils/format'; // Giả sử bạn đã có hàm này giống web

const LogItem = ({ item }) => {
    // Helper chọn icon và màu sắc
    const getActionInfo = (action) => {
        switch (action) {
            case 'LOGIN': return { icon: 'sign-in-alt', color: '#3B82F6', label: 'Đăng nhập' };
            case 'LOGOUT': return { icon: 'sign-out-alt', color: '#6B7280', label: 'Đăng xuất' };
            case 'GOOGLE_LOGIN': return { icon: 'google', color: '#EF4444', label: 'Google Login' };
            case 'REFRESH_TOKEN': return { icon: 'sync-alt', color: '#F59E0B', label: 'Làm mới Token' };
            default: return { icon: 'globe', color: '#9CA3AF', label: action };
        }
    };

    const { icon, color, label } = getActionInfo(item.action);

    return (
        <View style={styles.container}>
            {/* Cột trái: Icon Action */}
            <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}> 
                <FontAwesome5 name={icon} size={16} color={color} />
            </View>

            {/* Cột giữa: Thông tin chính */}
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.actionText}>{label}</Text>
                    <Text style={styles.timeText}>{formatDate(item.timestamp)}</Text>
                </View>
                
                <View style={styles.userRow}>
                    <FontAwesome5 name="user" size={10} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text style={styles.usernameText}>{item.username || 'Unknown'}</Text>
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.ipBadge}>
                        <Text style={styles.ipText}>{item.ipAddress}</Text>
                    </View>
                    {item.errorMessage && (
                         <Text style={styles.errorText} numberOfLines={1}>
                             • {item.errorMessage}
                         </Text>
                    )}
                </View>
            </View>

            {/* Cột phải: Trạng thái chấm tròn */}
            <View style={styles.statusCol}>
                <View style={[styles.statusDot, { backgroundColor: item.success ? '#10B981' : '#EF4444' }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: { flex: 1 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    actionText: { fontSize: 14, fontWeight: '600', color: '#374151' },
    timeText: { fontSize: 11, color: '#9CA3AF' },
    
    userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    usernameText: { fontSize: 13, color: '#4B5563' },

    metaRow: { flexDirection: 'row', alignItems: 'center' },
    ipBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    ipText: { fontSize: 10, color: '#6B7280', fontFamily: 'Courier New' }, // Font monospace cho IP
    errorText: { fontSize: 11, color: '#EF4444', marginLeft: 6, flex: 1 },

    statusCol: { justifyContent: 'center', paddingLeft: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 }
});

export default LogItem;