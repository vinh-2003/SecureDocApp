import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { SIDEBAR_MENUS, ADMIN_SIDEBAR_MENUS } from '../../constants';
import { AuthContext } from '../../context/AuthContext';

/**
 * Navigation menu trong Sidebar
 */
const SidebarNav = () => {
    const { user } = useContext(AuthContext);

    // Kiểm tra quyền Admin
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    return (
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
            {/* Menu chính cho mọi User */}
            {SIDEBAR_MENUS.map((item) => (
                <NavItem
                    key={item.path}
                    path={item.path}
                    name={item.name}
                    icon={item.icon}
                />
            ))}

            {/* Menu Admin (Chỉ hiện khi là Admin) */}
            {isAdmin && (
                <>
                    <div className="pt-4 pb-2">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Quản trị
                        </p>
                    </div>
                    {ADMIN_SIDEBAR_MENUS.map((item) => (
                        <NavItem
                            key={item.path}
                            path={item.path}
                            name={item.name}
                            icon={item.icon}
                        />
                    ))}
                </>
            )}
        </nav>
    );
};

/**
 * Một item trong navigation
 */
const NavItem = ({ path, name, icon: Icon }) => {
    return (
        <NavLink
            to={path}
            end={path === '/'}
            className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-md transition-colors
                ${isActive
                    ? 'bg-gray-800 text-blue-400 border-l-4 border-blue-500'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
            `}
        >
            <Icon className="text-lg" />
            <span className="font-medium">{name}</span>
        </NavLink>
    );
};

export default SidebarNav;