import React, { useMemo } from 'react';
import { FaShieldAlt } from 'react-icons/fa';

// Regex cho ký tự đặc biệt
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

/**
 * Component hiển thị độ mạnh của mật khẩu
 */
const PasswordStrength = ({ password = '' }) => {
    const strength = useMemo(() => {
        if (!password) return { score: 0, label: '', color: '', bgColor: '' };

        let score = 0;

        // Độ dài
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;

        // Có chữ thường
        if (/[a-z]/.test(password)) score += 1;

        // Có chữ hoa
        if (/[A-Z]/.test(password)) score += 1;

        // Có số
        if (/[0-9]/.test(password)) score += 1;

        // Có ký tự đặc biệt
        if (SPECIAL_CHAR_REGEX.test(password)) score += 1;

        // Map score to label and color
        if (score <= 2) {
            return { score: 1, label: 'Yếu', color: 'text-red-500', bgColor: 'bg-red-500' };
        } else if (score <= 3) {
            return { score: 2, label: 'Trung bình', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
        } else if (score <= 4) {
            return { score: 3, label: 'Khá', color: 'text-blue-500', bgColor: 'bg-blue-500' };
        } else {
            return { score: 4, label: 'Mạnh', color: 'text-green-500', bgColor: 'bg-green-500' };
        }
    }, [password]);

    if (!password) return null;

    return (
        <div className="mt-2">
            {/* Strength bars */}
            <div className="flex gap-1 mb-1.5">
                {[1, 2, 3, 4].map((level) => (
                    <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${level <= strength.score ? strength.bgColor : 'bg-gray-200'
                            }`}
                    />
                ))}
            </div>

            {/* Label with icon */}
            <div className={`flex items-center gap-1.5 text-xs ${strength.color}`}>
                <FaShieldAlt size={10} />
                <span>Độ mạnh:  <span className="font-medium">{strength.label}</span></span>
            </div>
        </div>
    );
};

export default PasswordStrength;