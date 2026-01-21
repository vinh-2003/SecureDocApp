import React from 'react';
import { AppLogo } from '../Common';

/**
 * Logo trong Sidebar
 */
const SidebarLogo = ({ collapsed = false }) => {
    return (
        <div className="h-16 flex items-center justify-center border-b border-gray-700 px-4">
            <AppLogo
                size={collapsed ? 'sm' : 'md'}
                showText={!collapsed}
                linkTo="/"
                variant="dark"
            />
        </div>
    );
};

export default SidebarLogo;