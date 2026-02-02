import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Dimensions
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Components
import SecureImage from './SecureImage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ThumbnailSidebar = ({
    pages = [],
    currentPageIndex,
    onPageClick,
    onClose
}) => {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Trang ({pages.length})</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <FontAwesome5 name="times" size={14} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Thumbnails */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {pages.map((page, index) => {
                    const isActive = index === currentPageIndex;
                    const isLocked = page.locked && !page.canViewClear;

                    return (
                        <TouchableOpacity
                            key={page.id}
                            style={[
                                styles.thumbnailItem,
                                isActive && styles.thumbnailItemActive
                            ]}
                            onPress={() => onPageClick(index)}
                            activeOpacity={0.7}
                        >
                            {/* Thumbnail Image */}
                            <View style={styles.thumbnailImageContainer}>
                                <SecureImage
                                    pageId={page.id}
                                    isLocked={isLocked}
                                    style={styles.thumbnailImage}
                                    isThumbnail={true}
                                />

                                {/* Lock indicator */}
                                {page.locked && (
                                    <View style={styles.lockBadge}>
                                        <FontAwesome5 name="lock" size={8} color="#fff" />
                                    </View>
                                )}
                            </View>

                            {/* Page Number */}
                            <Text style={[
                                styles.pageNumber,
                                isActive && styles.pageNumberActive
                            ]}>
                                {index + 1}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 100,
        backgroundColor: '#374151',
        borderRightWidth: 1,
        borderRightColor: '#4B5563'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#4B5563'
    },
    headerTitle: {
        color: '#E5E7EB',
        fontSize: 12,
        fontWeight: '600'
    },
    closeButton: {
        padding: 4
    },
    scrollView: {
        flex: 1
    },
    scrollContent: {
        padding: 8,
        gap: 8
    },
    thumbnailItem: {
        alignItems: 'center',
        padding: 4,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'transparent'
    },
    thumbnailItemActive: {
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
    },
    thumbnailImageContainer: {
        width: 72,
        height: 100,
        backgroundColor: '#1F2937',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative'
    },
    thumbnailImage: {
        width: '100%',
        height: '100%'
    },
    lockBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#EAB308',
        justifyContent: 'center',
        alignItems: 'center'
    },
    pageNumber: {
        color: '#9CA3AF',
        fontSize: 11,
        marginTop: 4,
        fontWeight: '500'
    },
    pageNumberActive: {
        color: '#3B82F6',
        fontWeight: '700'
    }
});

export default ThumbnailSidebar;