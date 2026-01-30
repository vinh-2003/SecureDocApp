import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import useFileIcon from '../../hooks/useFileIcon'; // Hook icon bạn đã có

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // Chia 2 cột, trừ padding

const FileGridItem = ({ item, onPress, onLongPress }) => {
    const { getFileIcon } = useFileIcon();

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={300}
        >
            <View style={styles.iconContainer}>
                {getFileIcon(item, 40)}
            </View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.size}>
                    {item.type === 'FOLDER' ? 'Thư mục' : (item.size / 1024).toFixed(1) + ' KB'}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: ITEM_WIDTH,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        margin: 6,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    iconContainer: { marginBottom: 10, height: 50, justifyContent: 'center' },
    info: { width: '100%', alignItems: 'center' },
    name: { fontSize: 14, fontWeight: '500', color: '#1F2937', marginBottom: 2 },
    size: { fontSize: 11, color: '#9CA3AF' }
});

export default FileGridItem;