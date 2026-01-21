import React, { useMemo } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

// Regex cho ký tự đặc biệt (không cần escape trong character class)
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,. <>/? ]/;

/**
 * Component hiển thị các yêu cầu mật khẩu và check realtime
 */
const PasswordRequirements = ({ password = '', show = true }) => {
    // Định nghĩa các yêu cầu
    const requirements = useMemo(() => [
        {
            id: 'minLength',
            label: 'Ít nhất 8 ký tự',
            test: (pwd) => pwd.length >= 8
        },
        {
            id: 'hasLowercase',
            label: 'Có chữ cái thường (a-z)',
            test: (pwd) => /[a-z]/.test(pwd)
        },
        {
            id: 'hasUppercase',
            label: 'Có chữ cái hoa (A-Z)',
            test: (pwd) => /[A-Z]/.test(pwd)
        },
        {
            id: 'hasNumber',
            label: 'Có chữ số (0-9)',
            test: (pwd) => /[0-9]/.test(pwd)
        },
        {
            id: 'hasSpecial',
            label: 'Có ký tự đặc biệt (! @#$%...)',
            test: (pwd) => SPECIAL_CHAR_REGEX.test(pwd)
        }
    ], []);

    // Kiểm tra từng yêu cầu
    const results = useMemo(() => {
        return requirements.map(req => ({
            ...req,
            passed: req.test(password)
        }));
    }, [requirements, password]);

    // Đếm số yêu cầu đạt
    const passedCount = results.filter(r => r.passed).length;
    const allPassed = passedCount === requirements.length;

    if (!show) return null;

    return (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">
                    Yêu cầu mật khẩu
                </span>
                <span className={`text-xs font-medium ${allPassed ? 'text-green-600' : 'text-gray-400'}`}>
                    {passedCount}/{requirements.length}
                </span>
            </div>

            {/* Requirements list */}
            <ul className="space-y-1.5">
                {results.map((req) => (
                    <RequirementItem
                        key={req.id}
                        label={req.label}
                        passed={req.passed}
                        hasInput={password.length > 0}
                    />
                ))}
            </ul>

            {/* All passed message */}
            {allPassed && password.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-green-600 flex items-center gap-1">
                        <FaCheck size={10} />
                        Mật khẩu đáp ứng tất cả yêu cầu!
                    </p>
                </div>
            )}
        </div>
    );
};

/**
 * Single requirement item
 */
const RequirementItem = ({ label, passed, hasInput }) => {
    const getStyles = () => {
        if (!hasInput) {
            return {
                icon: <div className="w-3 h-3 rounded-full border-2 border-gray-300" />,
                textColor: 'text-gray-500'
            };
        }

        if (passed) {
            return {
                icon: <FaCheck className="text-green-500" size={12} />,
                textColor: 'text-green-600'
            };
        }

        return {
            icon: <FaTimes className="text-red-400" size={12} />,
            textColor: 'text-red-500'
        };
    };

    const { icon, textColor } = getStyles();

    return (
        <li className={`flex items-center gap-2 text-xs transition-colors duration-200 ${textColor}`}>
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {icon}
            </span>
            <span>{label}</span>
        </li>
    );
};

export default PasswordRequirements;