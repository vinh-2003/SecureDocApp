import React from 'react';

/**
 * Divider với text ở giữa
 */
const AuthDivider = ({ text = 'hoặc' }) => {
    return (
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400 uppercase text-xs tracking-wider">
                    {text}
                </span>
            </div>
        </div>
    );
};

export default AuthDivider;