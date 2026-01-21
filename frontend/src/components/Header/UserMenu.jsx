import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
    FaUserCircle, FaSignOutAlt, FaUser, FaCog, FaKey
} from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';

/**
 * User dropdown menu component
 */
const UserMenu = ({ onChangePassword }) => {
    const { user, logout } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setIsOpen(false);
        logout();
    };

    const handleLinkClick = () => {
        setIsOpen(false);
    };

    const handleChangePasswordClick = () => {
        setIsOpen(false);
        onChangePassword?.();
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:bg-gray-100 p-1.5 rounded-lg transition"
            >
                <UserInfo user={user} />
                <UserAvatar user={user} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-lg shadow-xl py-2 animate-fade-in-down z-50">
                    {/* Header */}
                    <MenuHeader user={user} />

                    {/* Menu Items */}
                    <MenuItem
                        to="/profile"
                        icon={<FaUser />}
                        label="Thông tin tài khoản"
                        onClick={handleLinkClick}
                    />

                    <MenuButton
                        icon={<FaKey />}
                        label="Đổi mật khẩu"
                        onClick={handleChangePasswordClick}
                    />

                    <MenuItem
                        to="/settings"
                        icon={<FaCog />}
                        label="Cài đặt hệ thống"
                        onClick={handleLinkClick}
                    />

                    <div className="border-t my-1" />

                    {/* Logout */}
                    <MenuButton
                        icon={<FaSignOutAlt />}
                        label="Đăng xuất"
                        onClick={handleLogout}
                        variant="danger"
                    />
                </div>
            )}
        </div>
    );
};

/**
 * User info display (name & username)
 */
const UserInfo = ({ user }) => (
    <div className="text-right hidden md:block">
        <div className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">
            {user?.fullName || "User"}
        </div>
        <div className="text-xs text-gray-500 max-w-[120px] truncate">
            {user?.username}
        </div>
    </div>
);

/**
 * User avatar
 */
const UserAvatar = ({ user }) => {
    if (user?.avatarUrl) {
        return (
            <img
                src={user.avatarUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-gray-300 object-cover"
            />
        );
    }

    return <FaUserCircle className="text-gray-400 text-4xl" />;
};

/**
 * Menu header with user info
 */
const MenuHeader = ({ user }) => (
    <div className="px-4 py-3 border-b bg-gray-50">
        <p className="text-sm font-bold truncate">{user?.fullName}</p>
        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
    </div>
);

/**
 * Menu link item
 */
const MenuItem = ({ to, icon, label, onClick }) => (
    <Link
        to={to}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition"
        onClick={onClick}
    >
        <span className="text-gray-400">{icon}</span>
        <span>{label}</span>
    </Link>
);

/**
 * Menu button item
 */
const MenuButton = ({ icon, label, onClick, variant = 'default' }) => {
    const variantClasses = variant === 'danger'
        ? 'text-red-600 hover:bg-red-50 font-medium'
        : 'text-gray-700 hover:bg-blue-50';

    return (
        <button
            onClick={onClick}
            className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm transition ${variantClasses}`}
        >
            <span className={variant === 'danger' ? '' : 'text-gray-400'}>{icon}</span>
            <span>{label}</span>
        </button>
    );
};

export default UserMenu;