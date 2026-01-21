import React from 'react';
import { FaGlobeAsia, FaLock } from 'react-icons/fa';

/**
 * Component cho phép thay đổi quyền truy cập công khai
 * Dùng cho: ShareModal, các nơi cần chỉnh sửa quyền
 * 
 * @param {string} value - Giá trị hiện tại ('PRIVATE' | 'PUBLIC_VIEW' | 'PUBLIC_EDIT')
 * @param {Function} onChange - Callback khi thay đổi (nhận event)
 * @param {string} className - Class bổ sung cho container
 */
const PublicAccessSelect = ({ value, onChange, className = '' }) => {
    const isPrivate = value === 'PRIVATE';

    const getDescription = () => {
        switch (value) {
            case 'PRIVATE':
                return 'Chỉ những người được thêm mới có thể mở.';
            case 'PUBLIC_VIEW':
                return 'Bất kỳ ai có liên kết đều có thể xem. ';
            case 'PUBLIC_EDIT':
                return 'Bất kỳ ai có liên kết đều có thể chỉnh sửa.';
            default:
                return '';
        }
    };

    return (
        <div className={`pt-4 border-t ${className}`}>
            <p className="text-sm font-semibold text-gray-700 mb-3">Quyền truy cập chung</p>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isPrivate ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-600'}`}>
                        {isPrivate ? <FaLock /> : <FaGlobeAsia />}
                    </div>
                    <div className="flex-1">
                        <select
                            className="text-sm font-medium text-gray-800 bg-transparent outline-none cursor-pointer hover:underline appearance-none pr-4"
                            value={value}
                            onChange={onChange}
                            style={{ backgroundImage: 'none' }}
                        >
                            <option value="PRIVATE">Hạn chế</option>
                            <option value="PUBLIC_VIEW">Bất kỳ ai có đường liên kết (Người xem)</option>
                            <option value="PUBLIC_EDIT">Bất kỳ ai có đường liên kết (Người chỉnh sửa)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {getDescription()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicAccessSelect;