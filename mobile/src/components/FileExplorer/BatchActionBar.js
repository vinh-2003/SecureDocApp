import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const BatchActionBar = ({ selectedCount, onClear, onDelete, onMove }) => {
    if (selectedCount === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <TouchableOpacity onPress={onClear}>
                    <FontAwesome5 name="times" size={16} color="white" />
                </TouchableOpacity>
                <Text style={styles.count}>{selectedCount} đã chọn</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity onPress={onMove} style={styles.btn}>
                    <FontAwesome5 name="exchange-alt" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={styles.btn}>
                    <FontAwesome5 name="trash" size={16} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute', bottom: 20, left: 20, right: 20,
        backgroundColor: '#1F2937', borderRadius: 12,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 10
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    count: { color: 'white', fontWeight: 'bold' },
    actions: { flexDirection: 'row', gap: 20 },
    btn: { padding: 5 }
});

export default BatchActionBar;