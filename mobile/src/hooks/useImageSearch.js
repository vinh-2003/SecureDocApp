import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import fileService from '../services/fileService';

/**
 * Hook xử lý logic tìm kiếm bằng hình ảnh
 * Hỗ trợ chọn ảnh từ Camera hoặc Thư viện
 */
const useImageSearch = (options = {}) => {
    const { navigation, onSuccess } = options;
    const [isSearching, setIsSearching] = useState(false);

    /**
     * Yêu cầu quyền truy cập Camera
     */
    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Quyền truy cập',
                'Ứng dụng cần quyền truy cập Camera để chụp ảnh tìm kiếm.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    /**
     * Yêu cầu quyền truy cập Thư viện ảnh
     */
    const requestMediaLibraryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Quyền truy cập',
                'Ứng dụng cần quyền truy cập Thư viện ảnh để chọn hình.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    /**
     * Xử lý ảnh đã chọn/chụp và gọi API search
     */
    const processImage = useCallback(async (result) => {
        if (result.canceled || !result.assets || result.assets.length === 0) {
            return;
        }

        const asset = result.assets[0];
        const uri = asset.uri;
        const fileName = asset.fileName || `image_${Date.now()}.jpg`;

        setIsSearching(true);

        try {
            // Gọi API tìm kiếm bằng hình ảnh
            // Truyền trực tiếp asset thay vì FormData
            const res = await fileService.searchByImage({
                uri: uri,
                type: asset.mimeType || 'image/jpeg',
                name: fileName
            });

            if (res.success && res.data && res.data.length > 0) {
                Toast.show({
                    type: 'success',
                    text1: 'Tìm kiếm hoàn tất',
                    text2: `Đã tìm thấy ${res.data.length} kết quả tương tự`
                });

                // Callback nếu có
                onSuccess?.(res.data, fileName, uri);

                // Navigate đến SearchScreen với kết quả (nếu navigation được truyền vào)
                if (navigation) {
                    navigation.navigate('SearchScreen', {
                        imageResults: res.data,
                        imageName: fileName,
                        imagePreview: uri
                    });
                }
            } else {
                Toast.show({
                    type: 'info',
                    text1: 'Không tìm thấy',
                    text2: 'Không có kết quả tương tự với hình ảnh này'
                });
            }
        } catch (error) {
            console.error('Image search error:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi tìm kiếm',
                text2: error.message || 'Không thể tìm kiếm bằng hình ảnh. Vui lòng thử lại.'
            });
        } finally {
            setIsSearching(false);
        }
    }, [navigation, onSuccess]);

    /**
     * Mở Camera để chụp ảnh
     */
    const openCamera = useCallback(async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'], // Sử dụng array thay vì MediaTypeOptions
                allowsEditing: false,
                quality: 0.8
            });

            await processImage(result);
        } catch (error) {
            console.error('Camera error:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể mở camera'
            });
        }
    }, [processImage]);

    /**
     * Mở Thư viện ảnh để chọn
     */
    const openLibrary = useCallback(async () => {
        const hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], // Sử dụng array thay vì MediaTypeOptions
                allowsEditing: false,
                quality: 0.8
            });

            await processImage(result);
        } catch (error) {
            console.error('Library error:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể mở thư viện ảnh'
            });
        }
    }, [processImage]);

    /**
     * Hiển thị ActionSheet để chọn nguồn ảnh
     */
    const showImagePicker = useCallback(() => {
        Alert.alert(
            'Tìm kiếm bằng hình ảnh',
            'Chọn nguồn hình ảnh',
            [
                {
                    text: 'Chụp ảnh',
                    onPress: openCamera
                },
                {
                    text: 'Chọn từ thư viện',
                    onPress: openLibrary
                },
                {
                    text: 'Hủy',
                    style: 'cancel'
                }
            ],
            { cancelable: true }
        );
    }, [openCamera, openLibrary]);

    /**
     * Clear image search state
     */
    const clearImageSearch = useCallback(() => {
        if (navigation) {
            navigation.setParams({
                imageResults: null,
                imageName: null,
                imagePreview: null
            });
        }
    }, [navigation]);

    return {
        isSearching,
        showImagePicker,
        openCamera,
        openLibrary,
        clearImageSearch
    };
};

export default useImageSearch;