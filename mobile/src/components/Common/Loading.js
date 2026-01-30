import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';

export const LOADING_VARIANTS = {
    INLINE: 'inline',
    OVERLAY: 'overlay',
};

const Loading = ({ variant = 'inline', text = 'Đang xử lý...' }) => {
    if (variant === LOADING_VARIANTS.OVERLAY) {
        return (
            <Modal transparent animationType="fade" visible={true}>
                <View style={styles.overlay}>
                    <View style={styles.box}>
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text style={styles.text}>{text}</Text>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <View style={styles.inline}>
            <ActivityIndicator size="small" color="#2563EB" />
            {text && <Text style={styles.inlineText}>{text}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    inline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10 },
    inlineText: { marginLeft: 8, color: '#6B7280', fontSize: 14 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    box: { backgroundColor: 'white', padding: 24, borderRadius: 16, alignItems: 'center', elevation: 5 },
    text: { marginTop: 12, color: '#374151', fontSize: 16, fontWeight: '500' }
});

export default Loading;