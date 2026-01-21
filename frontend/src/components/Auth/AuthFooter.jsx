import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer link cho các trang Auth
 */
const AuthFooter = ({ text, linkText, linkTo }) => {
    return (
        <p className="mt-6 text-center text-sm text-gray-500">
            {text}{' '}
            <Link
                to={linkTo}
                className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition"
            >
                {linkText}
            </Link>
        </p>
    );
};

export default AuthFooter;