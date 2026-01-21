import React from 'react';
import { FaCamera, FaShieldAlt, FaUserTag, FaCalendarAlt } from 'react-icons/fa';
import { formatDate } from '../../utils/format';

/**
 * Card hiển thị thông tin cơ bản và avatar
 */
const ProfileCard = ({
    profile,
    previewImage,
    avatarInputProps,
    onImageChange
}) => {
    // Destructure register props
    const { ref: avatarRef, onChange: avatarOnChange, ...avatarRest } = avatarInputProps;

    // Handle change với validation
    const handleChange = (e) => {
        onImageChange(e, avatarOnChange);
    };

    // Generate avatar URL
    const avatarUrl = previewImage
        || profile?.avatarUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.username || 'User')}&background=random`;

    return (
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden text-center p-6">
            {/* Avatar */}
            <AvatarUpload
                avatarUrl={avatarUrl}
                avatarRef={avatarRef}
                avatarRest={avatarRest}
                onImageChange={handleChange}
            />

            {/* Name & Email */}
            <h2 className="text-xl font-bold text-gray-800 mb-1">
                {profile?.fullName || profile?.username}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
                {profile?.email}
            </p>

            {/* Roles */}
            <RolesBadges roles={profile?.roles || []} />

            {/* Meta Info */}
            <MetaInfo
                id={profile?.id}
                createdAt={profile?.createdAt}
            />
        </div>
    );
};

/**
 * Avatar với upload button
 */
const AvatarUpload = ({ avatarUrl, avatarRef, avatarRest, onImageChange }) => {
    return (
        <div className="relative mx-auto w-36 h-36 -mt-1 mb-4 group">
            {/* Avatar Image */}
            <div className="w-full h-full rounded-full p-1.5 bg-white shadow-md">
                <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover border border-gray-200"
                />
            </div>

            {/* Upload Button */}
            <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition transform hover:scale-105 group-hover:ring-4 ring-blue-100 border-2 border-white">
                <FaCamera size={14} />
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    {...avatarRest}
                    ref={avatarRef}
                    onChange={onImageChange}
                />
            </label>
        </div>
    );
};

/**
 * Roles badges
 */
const RolesBadges = ({ roles }) => {
    if (!roles.length) return null;

    return (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
            {roles.map((role, index) => (
                <span
                    key={index}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full border border-indigo-100 flex items-center gap-1"
                >
                    <FaShieldAlt size={10} /> {role}
                </span>
            ))}
        </div>
    );
};

/**
 * Meta information (ID, Join date)
 */
const MetaInfo = ({ id, createdAt }) => {
    return (
        <div className="border-t border-gray-100 pt-4 text-left space-y-3">
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                    <FaUserTag className="text-gray-400" /> ID:
                </span>
                <span className="font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded text-xs select-all">
                    {id}
                </span>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-400" /> Tham gia:
                </span>
                <span className="text-gray-700 font-medium">
                    {formatDate(createdAt)}
                </span>
            </div>
        </div>
    );
};

export default ProfileCard;