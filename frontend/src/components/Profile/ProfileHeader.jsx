import React from 'react';

/**
 * Header với cover image cho trang Profile
 */
const ProfileHeader = () => {
    return (
        <div className="h-56 bg-gradient-to-r from-blue-700 to-indigo-900 relative shadow-md overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute -top-10 -left-10 w-64 h-64 bg-white rounded-full mix-blend-overlay blur-3xl opacity-10" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400 rounded-full mix-blend-overlay blur-3xl opacity-20" />
            </div>

            {/* Title */}
            <div className="container mx-auto px-4 h-full flex items-center">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white drop-shadow-lg tracking-wide">
                        Hồ sơ cá nhân
                    </h1>
                    <p className="text-blue-100 text-sm mt-1 opacity-90">
                        Quản lý thông tin và cài đặt tài khoản của bạn
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;