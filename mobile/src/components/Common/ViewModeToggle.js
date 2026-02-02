import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Component toggle giữa chế độ xem List và Grid
 * Tương tự ViewModeToggle.jsx trên web
 */
const ViewModeToggle = ({
    viewMode = 'list',
    onViewModeChange
}) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.button,
                    viewMode === 'list' && styles.buttonActive
                ]}
                onPress={() => onViewModeChange?.('list')}
            >
                <FontAwesome5
                    name="list"
                    size={14}
                    color={viewMode === 'list' ? '#2563EB' : '#6B7280'}
                />
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.button,
                    viewMode === 'grid' && styles.buttonActive
                ]}
                onPress={() => onViewModeChange?.('grid')}
            >
                <FontAwesome5
                    name="th-large"
                    size={14}
                    color={viewMode === 'grid' ? '#2563EB' : '#6B7280'}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    button: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6
    },
    buttonActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    }
});

export default ViewModeToggle;