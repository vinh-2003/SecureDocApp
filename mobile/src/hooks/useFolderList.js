import { useState, useEffect, useMemo, useCallback } from 'react';
import fileService from '../services/fileService';

/**
 * Hook lấy danh sách folders của user
 * Hỗ trợ tạo cấu trúc cây (Tree) cho Dropdown chọn vị trí
 */
const useFolderList = () => {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch folders khi mount
    useEffect(() => {
        let isMounted = true;

        const loadFolders = async () => {
            setLoading(true);
            setError(null);

            try {
                // API lấy tất cả folder của user
                const res = await fileService.getAllUserFolders();
                if (isMounted && res.success && Array.isArray(res.data)) {
                    setFolders(res.data);
                }
            } catch (err) {
                console.error('Lỗi tải folders:', err);
                if (isMounted) {
                    setError('Không thể tải danh sách thư mục');
                    // Không Toast lỗi ở đây để tránh spam nếu dùng hook này ở nhiều nơi
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadFolders();

        return () => { isMounted = false; };
    }, []);

    // Helper: Lấy children của một folder (cho UI dạng cây nếu cần)
    const getFolderChildren = useCallback((parentId = null) => {
        return folders.filter(f =>
            parentId ? f.parentId === parentId : !f.parentId
        );
    }, [folders]);

    // Helper: Tìm folder theo ID
    const getFolderById = useCallback((id) => {
        return folders.find(f => f.id === id);
    }, [folders]);

    // QUAN TRỌNG: Build flat options với level indent (để hiển thị trong Picker)
    // Ví dụ: 
    // - Gốc
    //   -- Thư mục con
    //     ---- Thư mục cháu
    const folderOptions = useMemo(() => {
        const options = [];

        const buildOptions = (parentId = null, level = 0) => {
            // Lấy children và sort theo tên A-Z
            const children = folders
                .filter(f => parentId ? f.parentId === parentId : !f.parentId)
                .sort((a, b) => a.name.localeCompare(b.name));

            children.forEach(folder => {
                options.push({
                    id: folder.id,
                    name: folder.name,
                    level: level // Dùng level này để tạo dấu gạch đầu dòng trong UI
                });
                
                // Đệ quy để lấy children của folder hiện tại
                buildOptions(folder.id, level + 1);
            });
        };

        buildOptions(null, 0); // Bắt đầu từ root (parentId = null)
        return options;
    }, [folders]);

    return {
        folders,           // Danh sách gốc (phẳng, chưa sort)
        folderOptions,     // Danh sách đã sắp xếp theo cây (dùng cho Picker)
        loading,
        error,
        getFolderChildren,
        getFolderById,
        refresh: () => {   // Hàm để gọi lại API thủ công
            // Logic refresh có thể copy lại từ useEffect hoặc tách hàm ra
        }
    };
};

export default useFolderList;