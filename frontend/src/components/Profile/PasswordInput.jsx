import React from 'react';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const PasswordInput = ({
    label,
    name,
    register,
    rules,
    error,
    showPassword,
    onToggleShow,
    placeholder = '••••••••',
    autoComplete
}) => {
    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}
            </label>
            
            <div className="relative">
                {/* Icon Lock bên trái */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400 text-sm" />
                </div>

                {/* Input Field */}
                <input
                    id={name}
                    type={showPassword ? 'text' : 'password'}
                    {...register(name, rules)}
                    className={`
                        w-full pl-10 pr-10 py-2.5 border rounded-lg outline-none 
                        transition-all duration-200
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                    `}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                />

                {/* Nút Toggle bên phải */}
                <button
                    type="button"
                    onClick={onToggleShow}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors p-2"
                    tabIndex={-1}
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>

            {/* Thông báo lỗi */}
            {error && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 animate-fade-in">
                    <span>⚠</span> {error.message}
                </p>
            )}
        </div>
    );
};

export default PasswordInput;