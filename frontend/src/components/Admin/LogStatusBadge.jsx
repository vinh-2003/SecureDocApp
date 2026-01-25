import React from 'react';

const LogStatusBadge = ({ isSuccess, errorMessage }) => {
    if (isSuccess) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Thành công
            </span>
        );
    }

    return (
        <span 
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 cursor-help"
            title={errorMessage} // Hover để xem lỗi chi tiết
        >
            Thất bại
        </span>
    );
};

export default LogStatusBadge;