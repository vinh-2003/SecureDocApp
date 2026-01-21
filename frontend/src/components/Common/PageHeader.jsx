import React from 'react';

/**
 * Component Header cho các trang
 * 
 * @param {ReactNode} icon - Icon hiển thị
 * @param {string} title - Tiêu đề trang
 * @param {string} subtitle - Mô tả phụ
 * @param {ReactNode} actions - Các action buttons bên phải
 * @param {string} className - Class bổ sung
 */
const PageHeader = ({
    icon,
    title,
    subtitle,
    actions,
    className = ''
}) => {
    return (
        <div className={`flex items-center justify-between mb-6 ${className}`}>
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="text-2xl">
                        {icon}
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-gray-500">{subtitle}</p>
                    )}
                </div>
            </div>

            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default PageHeader;