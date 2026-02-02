import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

const ViewerToolbar = ({
    fileName,
    currentPage,
    totalPages,
    zoomLevel,
    isOwner,
    showSidebar,
    canGoNext,
    canGoPrev,
    onBack,
    onPrevPage,
    onNextPage,
    onZoomIn,
    onZoomOut,
    onToggleSidebar,
    onDownload,
    onManageAccess
}) => {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.toolbar}>
                {/* Left: Back & Title */}
                <View style={styles.leftSection}>
                    <TouchableOpacity style={styles.iconButton} onPress={onBack}>
                        <FontAwesome5 name="arrow-left" size={16} color="#E5E7EB" />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title} numberOfLines={1}>
                            {fileName || 'Tài liệu'}
                        </Text>
                        <Text style={styles.subtitle}>
                            Trang {currentPage} / {totalPages}
                        </Text>
                    </View>
                </View>

                {/* Right: Actions */}
                <View style={styles.rightSection}>
                    {/* Zoom Controls */}
                    <View style={styles.zoomContainer}>
                        <TouchableOpacity
                            style={styles.zoomButton}
                            onPress={onZoomOut}
                        >
                            <FontAwesome5 name="search-minus" size={12} color="#E5E7EB" />
                        </TouchableOpacity>
                        <Text style={styles.zoomText}>{zoomLevel}%</Text>
                        <TouchableOpacity
                            style={styles.zoomButton}
                            onPress={onZoomIn}
                        >
                            <FontAwesome5 name="search-plus" size={12} color="#E5E7EB" />
                        </TouchableOpacity>
                    </View>

                    {/* Sidebar Toggle */}
                    <TouchableOpacity
                        style={[styles.iconButton, showSidebar && styles.iconButtonActive]}
                        onPress={onToggleSidebar}
                    >
                        <FontAwesome5 name="th-list" size={14} color={showSidebar ? '#3B82F6' : '#E5E7EB'} />
                    </TouchableOpacity>

                    {/* Download */}
                    <TouchableOpacity style={styles.iconButton} onPress={onDownload}>
                        <FontAwesome5 name="download" size={14} color="#E5E7EB" />
                    </TouchableOpacity>

                    {/* Manage Access (Owner only) */}
                    {isOwner && (
                        <TouchableOpacity
                            style={styles.manageButton}
                            onPress={onManageAccess}
                        >
                            <FontAwesome5 name="user-cog" size={12} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#374151'
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#4B5563'
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    iconButtonActive: {
        backgroundColor: '#1F2937'
    },
    titleContainer: {
        marginLeft: 12,
        flex: 1
    },
    title: {
        color: '#F9FAFB',
        fontSize: 14,
        fontWeight: '600'
    },
    subtitle: {
        color: '#9CA3AF',
        fontSize: 11,
        marginTop: 2
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    zoomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4B5563',
        borderRadius: 8,
        paddingHorizontal: 4,
        marginRight: 8
    },
    zoomButton: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center'
    },
    zoomText: {
        color: '#E5E7EB',
        fontSize: 11,
        fontWeight: '600',
        minWidth: 36,
        textAlign: 'center'
    },
    manageButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 4
    }
});

export default ViewerToolbar;