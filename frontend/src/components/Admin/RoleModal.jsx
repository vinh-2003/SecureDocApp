import React, { useState, useEffect } from 'react';
import { FaUserShield } from 'react-icons/fa';

const RoleModal = ({ isOpen, onClose, onConfirm, initialRoles = [], isLoading }) => {
    const [selectedRoles, setSelectedRoles] = useState(new Set(initialRoles));

    useEffect(() => {
        if (isOpen) {
            setSelectedRoles(new Set(initialRoles));
        }
    }, [isOpen, initialRoles]);

    const handleToggle = (role) => {
        const newRoles = new Set(selectedRoles);
        if (newRoles.has(role)) {
            newRoles.delete(role);
        } else {
            newRoles.add(role);
        }
        setSelectedRoles(newRoles);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <FaUserShield size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Phân quyền người dùng</h3>
                    </div>

                    <p className="text-sm text-gray-500 mb-4">
                        Chọn các vai trò cho người dùng này.
                    </p>

                    <div className="space-y-3">
                        {['ROLE_USER', 'ROLE_ADMIN'].map((role) => (
                            <label key={role} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedRoles.has(role)}
                                    onChange={() => handleToggle(role)}
                                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    // Không cho phép bỏ ROLE_USER để tránh lỗi hệ thống
                                    disabled={role === 'ROLE_USER'} 
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">
                                        {role === 'ROLE_ADMIN' ? 'Quản trị viên (Admin)' : 'Người dùng (User)'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {role === 'ROLE_ADMIN' ? 'Toàn quyền hệ thống' : 'Quyền cơ bản'}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => onConfirm(Array.from(selectedRoles))}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleModal;