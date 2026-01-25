import React from 'react';
import { ACTIVITY_TYPES } from '../../constants/activityTypes';

/**
 * Badge hiển thị loại activity
 */
const ActivityBadge = ({ actionType }) => {
    const typeInfo = ACTIVITY_TYPES[actionType] || {
        label: actionType,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700'
    };

    return (
        <span className={`
            inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
            ${typeInfo.bgColor} ${typeInfo.textColor}
        `}>
            {typeInfo.label}
        </span>
    );
};

export default ActivityBadge;