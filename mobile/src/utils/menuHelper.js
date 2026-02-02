/**
 * =============================================================================
 * MENU HELPER
 * =============================================================================
 * Utility để xác định các menu options dựa trên permissions của file/folder
 * Tương tự ItemContextMenu.jsx trên web
 * =============================================================================
 */

/**
 * Cấu hình menu actions
 * Map giữa action key và thông tin hiển thị
 */
export const MENU_ACTIONS = {
    DOWNLOAD: { label: 'Tải xuống', icon: 'download', color: '#3B82F6' },
    RENAME: { label: 'Đổi tên', icon: 'pen', color: '#6B7280' },
    UPDATE_DESC: { label: 'Cập nhật mô tả', icon: 'align-left', color: '#6B7280' },
    MOVE: { label: 'Di chuyển', icon: 'arrows-alt', color: '#6B7280' },
    COPY: { label: 'Tạo bản sao', icon: 'clone', color: '#8B5CF6' },
    SHARE: { label: 'Chia sẻ', icon: 'share-alt', color: '#2563EB' },
    COPY_LINK: { label: 'Sao chép liên kết', icon: 'link', color: '#6B7280' },
    INFO: { label: 'Thông tin chi tiết', icon: 'info-circle', color: '#3B82F6' },
    RESTORE: { label: 'Khôi phục', icon: 'trash-restore', color: '#10B981' },
    TRASH: { label: 'Chuyển vào thùng rác', icon: 'trash', color: '#EF4444', isDanger: true },
    DELETE_PERMANENT: { label: 'Xóa vĩnh viễn', icon: 'trash', color: '#EF4444', isDanger: true }
};

/**
 * Lấy danh sách menu options dựa trên permissions của file
 * 
 * @param {Object} file - File/Folder object với permissions
 * @param {Object} options - Các tùy chọn bổ sung
 * @param {boolean} options.isTrashContext - Đang ở trong Thùng rác
 * @param {boolean} options.isSharedContext - Đang ở trang Được chia sẻ
 * @returns {Array} Danh sách menu options
 */
export const getMenuOptions = (file, options = {}) => {
    if (!file) return [];

    const { isTrashContext = false, isSharedContext = false } = options;

    // Lấy permissions từ file (fallback về defaults)
    const perms = file.permissions || getDefaultPermissions(file, options);

    // Định nghĩa menu config theo thứ tự
    const menuConfig = [
        // Nhóm Tải
        { key: 'DOWNLOAD', show: perms.canDownload && !isTrashContext },

        // Nhóm Sửa đổi
        { key: 'RENAME', show: perms.canRename && !isTrashContext },
        { key: 'UPDATE_DESC', show: perms.canUpdateDescription && !isTrashContext },
        { key: 'MOVE', show: perms.canMove && !isTrashContext },
        { key: 'COPY', show: perms.canCopy && !isTrashContext },

        // Nhóm Chia sẻ
        { key: 'SHARE', show: perms.canShare && !isTrashContext },
        { key: 'COPY_LINK', show: perms.canCopyLink },

        // Nhóm Khác
        { key: 'INFO', show: perms.canViewDetails !== false }, // Mặc định true

        // Nhóm Thùng rác
        { key: 'RESTORE', show: perms.canRestore && isTrashContext },
        { key: 'TRASH', show: perms.canDelete && !isTrashContext },
        { key: 'DELETE_PERMANENT', show: perms.canDeletePermanent && isTrashContext }
    ];

    // Lọc chỉ lấy những option được show
    return menuConfig
        .filter(item => item.show)
        .map(item => ({
            ...MENU_ACTIONS[item.key],
            action: item.key
        }));
};

/**
 * Lấy default permissions khi file không có permissions object
 * Dựa trên ownership và context
 */
const getDefaultPermissions = (file, options = {}) => {
    const { currentUserId, isSharedContext = false } = options;

    // Kiểm tra ownership
    const isOwner = file.ownerId === currentUserId ||
        file.owner?.id === currentUserId ||
        file.createdById === currentUserId;

    // Nếu là owner -> full quyền
    if (isOwner) {
        return {
            canDownload: file.type !== 'FOLDER',
            canRename: true,
            canUpdateDescription: true,
            canMove: true,
            canCopy: file.type !== 'FOLDER',
            canShare: true,
            canCopyLink: true,
            canViewDetails: true,
            canDelete: true,
            canRestore: false,
            canDeletePermanent: false
        };
    }

    // Nếu là shared file -> quyền hạn chế
    if (isSharedContext) {
        const permType = file.permissionType || file.permission || 'VIEWER';

        return {
            canDownload: file.type !== 'FOLDER',
            canRename: permType === 'EDITOR',
            canUpdateDescription: permType === 'EDITOR',
            canMove: false,
            canCopy: permType === 'EDITOR' && file.type !== 'FOLDER',
            canShare: false,
            canCopyLink: true,
            canViewDetails: true,
            canDelete: false,
            canRestore: false,
            canDeletePermanent: false
        };
    }

    // Default fallback
    return {
        canDownload: file.type !== 'FOLDER',
        canRename: false,
        canUpdateDescription: false,
        canMove: false,
        canCopy: false,
        canShare: false,
        canCopyLink: true,
        canViewDetails: true,
        canDelete: false,
        canRestore: false,
        canDeletePermanent: false
    };
};

/**
 * Chuyển đổi menu options thành format cho ActionSheet
 * 
 * @param {Array} menuOptions - Danh sách menu options từ getMenuOptions
 * @returns {Object} { options, cancelButtonIndex, destructiveButtonIndex }
 */
export const toActionSheetFormat = (menuOptions) => {
    const options = menuOptions.map(opt => opt.label);
    options.push('Hủy'); // Thêm nút Hủy

    const cancelButtonIndex = options.length - 1;

    // Tìm index của option danger (nếu có)
    const dangerIndex = menuOptions.findIndex(opt => opt.isDanger);
    const destructiveButtonIndex = dangerIndex !== -1 ? dangerIndex : undefined;

    return {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        menuOptions // Trả về để map action sau
    };
};

/**
 * Xử lý action từ ActionSheet index
 * 
 * @param {number} selectedIndex - Index được chọn từ ActionSheet
 * @param {Array} menuOptions - Danh sách menu options
 * @param {Object} fileActions - Hook fileActions
 * @param {Object} item - File/folder item
 */
export const handleActionSheetSelection = (selectedIndex, menuOptions, fileActions, item) => {
    // Nếu là nút Hủy hoặc index không hợp lệ
    if (selectedIndex >= menuOptions.length || selectedIndex < 0) {
        return;
    }

    const selectedAction = menuOptions[selectedIndex]?.action;
    if (!selectedAction) return;

    // Map action to fileActions method
    switch (selectedAction) {
        case 'DOWNLOAD':
            fileActions.handleDownload?.(item);
            break;
        case 'RENAME':
            fileActions.openRenameModal?.(item);
            break;
        case 'UPDATE_DESC':
            fileActions.openDescModal?.(item);
            break;
        case 'MOVE':
            fileActions.openMoveModal?.([item]);
            break;
        case 'COPY':
            fileActions.handleCopyFile?.(item);
            break;
        case 'SHARE':
            fileActions.openShareModal?.(item);
            break;
        case 'COPY_LINK':
            fileActions.handleCopyLink?.(item);
            break;
        case 'INFO':
            fileActions.openInfoModal?.(item);
            break;
        case 'RESTORE':
            fileActions.handleRestore?.([item]);
            break;
        case 'TRASH':
            fileActions.openDeleteModal?.([item]);
            break;
        case 'DELETE_PERMANENT':
            fileActions.openDeletePermanentModal?.([item]);
            break;
        default:
            console.warn('Unknown action:', selectedAction);
    }
};