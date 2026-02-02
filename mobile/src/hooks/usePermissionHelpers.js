import { useCallback } from 'react';

/**
 * Hook cung cấp các helper function cho việc hiển thị permission
 * Đồng bộ với usePermissionHelpers.js trên Web
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
     * Lấy màu sắc của quyền (trả về object cho React Native)
     */
    const getPermissionColor = useCallback((type) => {
        switch (type) {
            case 'INHERITED_OWNER':
                return { color: '#7C3AED', bgColor: '#EDE9FE', borderColor: '#DDD6FE' };
            case 'EDITOR':
                return { color: '#F97316', bgColor: '#FFEDD5', borderColor: '#FED7AA' };
            case 'COMMENTER':
                return { color: '#14B8A6', bgColor: '#CCFBF1', borderColor: '#99F6E4' };
            case 'VIEWER':
            default:
                return { color: '#3B82F6', bgColor: '#DBEAFE', borderColor: '#BFDBFE' };
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