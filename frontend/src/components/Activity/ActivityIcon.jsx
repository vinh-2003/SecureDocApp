import React from 'react';
import {
    FaUpload, FaFolderPlus, FaEdit, FaFileAlt,
    FaArrowsAlt, FaCopy, FaTrash, FaUndo, FaTrashAlt,
    FaShare, FaUserMinus, FaGlobe, FaDownload, FaEye
} from 'react-icons/fa';
import { ACTIVITY_TYPES } from '../../constants/activityTypes';

/**
 * Icon cho từng loại activity
 */
const ActivityIcon = ({ actionType, size = 16 }) => {
    const typeInfo = ACTIVITY_TYPES[actionType] || {};

    const iconMap = {
        upload: FaUpload,
        'folder-plus': FaFolderPlus,
        edit: FaEdit,
        'file-text': FaFileAlt,
        move: FaArrowsAlt,
        copy: FaCopy,
        trash: FaTrash,
        refresh: FaUndo,
        'trash-2': FaTrashAlt,
        share: FaShare,
        'user-minus': FaUserMinus,
        globe: FaGlobe,
        download: FaDownload,
        eye: FaEye
    };

    const IconComponent = iconMap[typeInfo.icon] || FaFileAlt;

    return (
        <div className={`p-2 rounded-full ${typeInfo.bgColor || 'bg-gray-100'}`}>
            <IconComponent
                size={size}
                className={typeInfo.textColor || 'text-gray-600'}
            />
        </div>
    );
};

export default ActivityIcon;