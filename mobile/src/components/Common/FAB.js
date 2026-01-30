import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useActionSheet } from '@expo/react-native-action-sheet';

const FAB = ({ onCreateFolder, onUpload }) => {
    const { showActionSheetWithOptions } = useActionSheet();

    const handlePress = () => {
        const options = ['Tải lên tệp', 'Tạo thư mục mới', 'Hủy'];
        const cancelButtonIndex = 2;

        showActionSheetWithOptions(
            { options, cancelButtonIndex },
            (selectedIndex) => {
                if (selectedIndex === 0) onUpload();
                if (selectedIndex === 1) onCreateFolder();
            }
        );
    };

    return (
        <TouchableOpacity style={styles.fab} onPress={handlePress} activeOpacity={0.8}>
            <FontAwesome5 name="plus" size={24} color="white" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    }
});

export default FAB;