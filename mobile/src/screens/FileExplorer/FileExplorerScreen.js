import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FileExplorerScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.text}>Đây là Trình khám phá tệp (File Explorer)</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    text: { fontSize: 18, fontWeight: 'bold' }
});

export default FileExplorerScreen;