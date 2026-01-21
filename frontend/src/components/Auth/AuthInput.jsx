import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * Input field cho các form Auth
 */
const AuthInput = ({
    label,
    type = 'text',
    placeholder,
    icon: Icon,
    error,
    rightElement,
    register,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="space-y-1.5">
            {/* Label */}
            {label && (
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                        {label}
                    </label>
                    {rightElement}
                </div>
            )}

            {/* Input */}
            <div className="relative">
                {/* Left Icon */}
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className="text-gray-400" size={16} />
                    </div>
                )}

                <input
                    type={inputType}
                    placeholder={placeholder}
                    className={`
                        w-full px-4 py-3 border rounded-xl text-sm
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${Icon ? 'pl-10' : ''}
                        ${isPassword ? 'pr-10' : ''}
                        ${error
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                        }
                    `}
                    {...register}
                    {...props}
                />

                {/* Password Toggle */}
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                    >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <span>⚠</span> {error}
                </p>
            )}
        </div>
    );
};

export default AuthInput;