import React, { useCallback } from 'react';
// [THAY ĐỔI] Dùng FontAwesome5 của Expo
import { FontAwesome5 } from '@expo/vector-icons';

const useFileIcon = () => {
    const getFileIcon = useCallback((file, size = 24, color) => {
        if (!file) return <FontAwesome5 name="file" size={size} color={color || "#9CA3AF"} />;

        const { type, status, name, extension } = file;
        // Logic lấy đuôi file giữ nguyên
        const ext = extension?.toLowerCase() || name?.split('.').pop()?.toLowerCase() || '';

        // 1. Loading
        if (status === 'PROCESSING') {
            return <FontAwesome5 name="spinner" size={size} color="#3B82F6" />; // Icon spinner tĩnh, bạn có thể animate view bao ngoài
        }

        // 2. Folder
        if (type === 'FOLDER') {
            return <FontAwesome5 name="folder" solid size={size} color="#F59E0B" />;
        }

        // 3. Mapping loại file sang Icon Name của FontAwesome5
        let iconName = 'file-alt';
        let iconColor = '#6B7280'; // Gray

        // Image
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            iconName = 'file-image';
            iconColor = '#8B5CF6'; // Purple
        }
        // PDF
        else if (ext === 'pdf') {
            iconName = 'file-pdf';
            iconColor = '#EF4444'; // Red
        }
        // Word
        else if (['doc', 'docx'].includes(ext)) {
            iconName = 'file-word';
            iconColor = '#2563EB'; // Blue
        }
        // Excel
        else if (['xls', 'xlsx', 'csv'].includes(ext)) {
            iconName = 'file-excel';
            iconColor = '#10B981'; // Green
        }
        // Audio/Video
        else if (['mp3', 'wav'].includes(ext)) {
            iconName = 'file-audio';
            iconColor = '#F59E0B';
        }
        else if (['mp4', 'mov'].includes(ext)) {
            iconName = 'file-video';
            iconColor = '#EF4444';
        }
        // Code/Archive
        else if (['zip', 'rar'].includes(ext)) iconName = 'file-archive';
        else if (['js', 'html', 'css', 'json'].includes(ext)) iconName = 'file-code';

        return <FontAwesome5 name={iconName} size={size} color={color || iconColor} />;
    }, []);

    return { getFileIcon };
};

export default useFileIcon;