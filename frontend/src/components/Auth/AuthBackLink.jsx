import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

/**
 * Link quay lại cho các trang Auth
 */
const AuthBackLink = ({ to = '/login', text = 'Quay lại Đăng nhập' }) => {
    return (
        <div className="mt-6 text-center">
            <Link
                to={to}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition group"
            >
                <FaArrowLeft
                    size={12}
                    className="group-hover:-translate-x-1 transition-transform"
                />
                <span>{text}</span>
            </Link>
        </div>
    );
};

export default AuthBackLink;