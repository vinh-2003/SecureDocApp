import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Image,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Text
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Import từ legacy để tương thích
import * as FileSystem from 'expo-file-system/legacy';

// API
import { getToken, getBaseUrl } from '../../api/axiosClient';

const SecureImage = ({
    pageId,
    isLocked = false,
    zoomLevel = 100,
    style,
    isThumbnail = false
}) => {
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const loadImage = useCallback(async () => {
        if (!pageId) {
            setLoading(false);
            setError('Không có pageId');
            return;
        }

        if (isLocked) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Chưa đăng nhập');
            }

            const baseUrl = getBaseUrl();
            const imageUrl = `${baseUrl}/pages/${pageId}/image`;

            console.log('📷 Loading image:', imageUrl);

            // Tạo thư mục cache
            const cacheDir = `${FileSystem.cacheDirectory}secure_pages/`;
            const dirInfo = await FileSystem.getInfoAsync(cacheDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
            }

            const cachedFilePath = `${cacheDir}${pageId}.jpg`;

            // Kiểm tra cache
            const cachedInfo = await FileSystem.getInfoAsync(cachedFilePath);
            if (cachedInfo.exists && cachedInfo.size > 0) {
                console.log('📷 Using cached image');
                if (isMounted.current) {
                    setImageUri(cachedFilePath);
                    setLoading(false);
                }
                return;
            }

            // Download với token
            console.log('📷 Downloading...');
            const downloadResult = await FileSystem.downloadAsync(
                imageUrl,
                cachedFilePath,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'image/jpeg, image/*'
                    }
                }
            );

            if (!isMounted.current) return;

            if (downloadResult.status === 200) {
                const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
                if (fileInfo.exists && fileInfo.size > 0) {
                    setImageUri(downloadResult.uri);
                    console.log('📷 Image loaded successfully');
                } else {
                    throw new Error('File rỗng');
                }
            } else if (downloadResult.status === 401) {
                throw new Error('Phiên đăng nhập hết hạn');
            } else if (downloadResult.status === 403) {
                throw new Error('Không có quyền xem');
            } else if (downloadResult.status === 404) {
                throw new Error('Không tìm thấy trang');
            } else {
                throw new Error(`Lỗi server (${downloadResult.status})`);
            }
        } catch (err) {
            console.error('📷 SecureImage error:', err);
            if (isMounted.current) {
                setError(err.message || 'Lỗi tải ảnh');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [pageId, isLocked]);

    useEffect(() => {
        loadImage();
    }, [loadImage]);

    const handleRetry = useCallback(async () => {
        try {
            const cacheDir = `${FileSystem.cacheDirectory}secure_pages/`;
            const cachedFilePath = `${cacheDir}${pageId}.jpg`;
            await FileSystem.deleteAsync(cachedFilePath, { idempotent: true });
        } catch (e) {
            // Ignore
        }
        loadImage();
    }, [pageId, loadImage]);

    // =========================================================================
    // RENDER
    // =========================================================================

    if (isLocked) {
        return (
            <View style={[styles.container, style, styles.lockedContainer]}>
                <View style={styles.lockedContent}>
                    <FontAwesome5 name="lock" size={isThumbnail ? 16 : 32} color="#9CA3AF" />
                    {!isThumbnail && <Text style={styles.lockedText}>Trang bị khóa</Text>}
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={[styles.container, style, styles.loadingContainer]}>
                <ActivityIndicator size={isThumbnail ? 'small' : 'large'} color="#3B82F6" />
                {!isThumbnail && <Text style={styles.loadingText}>Đang tải trang...</Text>}
            </View>
        );
    }

    if (error || !imageUri) {
        return (
            <View style={[styles.container, style, styles.errorContainer]}>
                <FontAwesome5 name="exclamation-triangle" size={isThumbnail ? 14 : 24} color="#EF4444" />
                {!isThumbnail && (
                    <>
                        <Text style={styles.errorText}>{error || 'Không thể tải ảnh'}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                            <FontAwesome5 name="redo" size={12} color="#3B82F6" />
                            <Text style={styles.retryText}>Thử lại</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <Image
                source={{ uri: imageUri }}
                style={[
                    styles.image,
                    !isThumbnail && { transform: [{ scale: zoomLevel / 100 }] }
                ]}
                resizeMode={isThumbnail ? 'cover' : 'contain'}
                onError={() => {
                    setError('Không thể hiển thị ảnh');
                    setImageUri(null);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1F2937' },
    image: { flex: 1, width: '100%', height: '100%' },
    loadingContainer: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#374151' },
    loadingText: { color: '#9CA3AF', fontSize: 12, marginTop: 12 },
    errorContainer: { justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#374151' },
    errorText: { color: '#F87171', fontSize: 13, marginTop: 8, textAlign: 'center' },
    retryButton: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
        paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1F2937',
        borderRadius: 8, borderWidth: 1, borderColor: '#3B82F6'
    },
    retryText: { color: '#3B82F6', fontSize: 13, fontWeight: '600' },
    lockedContainer: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#4B5563' },
    lockedContent: { alignItems: 'center' },
    lockedText: { color: '#9CA3AF', fontSize: 12, marginTop: 8 }
});

export default SecureImage;