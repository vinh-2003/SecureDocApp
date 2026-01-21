import { useCallback } from 'react';

/**
 * Hook cung cấp các helper function cho việc hiển thị permission
 * 
 * @returns {Object} - Các helper functions
 */
const usePermissionHelpers = () => {
    /**
     * Lấy tên hiển thị của quyền
     */
    const getPermissionLabel = useCallback((type) => {
        switch (type) {
            case 'INHERITED_OWNER': return 'Chủ sở hữu (Kế thừa)';
            case 'EDITOR': return 'Người chỉnh sửa';
            case 'COMMENTER': return 'Người nhận xét';
            case 'VIEWER':
            default: return 'Người xem';
        }
    }, []);

    /**
     * Lấy màu sắc Badge của quyền
     */
    const getPermissionColor = useCallback((type) => {
        switch (type) {
            case 'INHERITED_OWNER':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'EDITOR':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'COMMENTER':
                return 'bg-teal-50 text-teal-700 border-teal-200';
            case 'VIEWER':
            default:
                return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    }, []);

    /**
     * Kiểm tra xem quyền có phải kế thừa không
     */
    const isInheritedPermission = useCallback((type) => {
        return type === 'INHERITED_OWNER';
    }, []);

    return {
        getPermissionLabel,
        getPermissionColor,
        isInheritedPermission
    };
};

export default usePermissionHelpers;