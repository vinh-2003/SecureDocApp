import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook tính toán quyền upload dựa trên location và permissions từ context
 * 
 * @param {Object} currentPermissions - Permissions từ FileContext
 * @returns {Object} Effective permissions và helper flags
 */
const useUploadPermissions = (currentPermissions) => {
    const location = useLocation();

    return useMemo(() => {
        // Chỉ cho phép upload ở Root hoặc trong Folder
        const isValidLocation =
            location.pathname === '/' ||
            location.pathname.startsWith('/folders/');

        // Quyền thực tế = Đúng vị trí AND Có quyền từ Context
        const effectivePermissions = {
            canCreateFolder: isValidLocation && currentPermissions.canCreateFolder,
            canUploadFile: isValidLocation && currentPermissions.canUploadFile,
            canUploadFolder: isValidLocation && currentPermissions.canUploadFolder
        };

        // Có ít nhất 1 hành động được phép không? 
        const canDoAnything =
            effectivePermissions.canCreateFolder ||
            effectivePermissions.canUploadFile ||
            effectivePermissions.canUploadFolder;

        return {
            ...effectivePermissions,
            canDoAnything,
            isValidLocation
        };
    }, [location.pathname, currentPermissions]);
};

export default useUploadPermissions;