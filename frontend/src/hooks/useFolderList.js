import { useState, useEffect, useMemo, useCallback } from 'react';
import fileService from '../services/fileService';

/**
 * Hook lấy danh sách folders của user
 * 
 * @returns {Object} State và helpers
 */
const useFolderList = () => {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch folders khi mount
    useEffect(() => {
        const loadFolders = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fileService.getAllUserFolders();
                if (res.success && Array.isArray(res.data)) {
                    setFolders(res.data);
                }
            } catch (err) {
                console.error('Lỗi tải folders:', err);
                setError('Không thể tải danh sách thư mục');
            } finally {
                setLoading(false);
            }
        };

        loadFolders();
    }, []);

    // Lấy children của một folder
    const getFolderChildren = useCallback((parentId = null) => {
        return folders.filter(f =>
            parentId ? f.parentId === parentId : !f.parentId
        );
    }, [folders]);

    // Tìm folder theo ID
    const getFolderById = useCallback((id) => {
        return folders.find(f => f.id === id);
    }, [folders]);

    // Build flat options với indent (giữ cấu trúc cây)
    const folderOptions = useMemo(() => {
        const options = [];

        const buildOptions = (parentId = null, level = 0) => {
            // Lấy children và sort theo tên
            const children = folders
                .filter(f => parentId ? f.parentId === parentId : !f.parentId)
                .sort((a, b) => a.name.localeCompare(b.name));

            children.forEach(folder => {
                options.push({
                    id: folder.id,
                    name: folder.name,
                    level: level
                });
                // Đệ quy để lấy children
                buildOptions(folder.id, level + 1);
            });
        };

        buildOptions(null, 0);
        return options;
    }, [folders]);

    return {
        folders,
        folderOptions,
        loading,
        error,
        getFolderById,
        getFolderChildren
    };
};

export default useFolderList;