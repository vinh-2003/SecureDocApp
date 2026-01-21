import React from 'react';
import { FaUser, FaEnvelope, FaPen, FaSave } from 'react-icons/fa';
import { Spinner } from '../Common/Loading';

/**
 * Form chỉnh sửa thông tin profile
 */
const ProfileForm = ({
    profile,
    register,
    errors,
    isSubmitting,
    onCancel
}) => {
    return (
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 md:p-8">
            {/* Header */}
            <FormHeader />

            <div className="space-y-6">
                {/* Account Info Section */}
                <AccountInfoSection profile={profile} />

                {/* Personal Info Section */}
                <PersonalInfoSection
                    register={register}
                    errors={errors}
                />

                {/* Action Buttons */}
                <FormActions
                    isSubmitting={isSubmitting}
                    onCancel={onCancel}
                />
            </div>
        </div>
    );
};

/**
 * Form header
 */
const FormHeader = () => (
    <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <FaPen size={18} />
        </div>
        <div>
            <h3 className="text-lg font-bold text-gray-800">Cập nhật thông tin</h3>
            <p className="text-xs text-gray-500">Chỉnh sửa thông tin cá nhân của bạn</p>
        </div>
    </div>
);

/**
 * Account info section (read-only)
 */
const AccountInfoSection = ({ profile }) => (
    <div>
        <SectionTitle>Thông tin tài khoản</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Username */}
            <ReadOnlyField
                label="Tên đăng nhập"
                value={profile?.username}
                icon={<FaUser className="text-gray-400" />}
            />

            {/* Email */}
            <ReadOnlyField
                label="Email"
                value={profile?.email}
                icon={<FaEnvelope className="text-gray-400" />}
            />
        </div>
    </div>
);

/**
 * Personal info section (editable)
 */
const PersonalInfoSection = ({ register, errors }) => (
    <div className="pt-2">
        <SectionTitle>Thông tin cá nhân</SectionTitle>

        {/* Full Name */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
                type="text"
                {...register('fullName', {
                    required: 'Họ tên không được để trống',
                    minLength: {
                        value: 2,
                        message: 'Họ tên phải có ít nhất 2 ký tự'
                    },
                    maxLength: {
                        value: 100,
                        message: 'Họ tên không được quá 100 ký tự'
                    }
                })}
                placeholder="Nhập họ tên đầy đủ..."
                className={`
                    w-full px-4 py-2.5 border rounded-lg text-gray-800 text-sm 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                    outline-none transition shadow-sm
                    ${errors.fullName ? 'border-red-500 ring-1 ring-red-100' : 'border-gray-300'}
                `}
            />
            {errors.fullName && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠</span> {errors.fullName.message}
                </p>
            )}
        </div>
    </div>
);

/**
 * Form action buttons
 */
const FormActions = ({ isSubmitting, onCancel }) => (
    <div className="pt-6 border-t mt-4 flex items-center justify-end gap-3">
        <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition disabled:opacity-50"
        >
            Hủy bỏ
        </button>

        <button
            type="submit"
            disabled={isSubmitting}
            className={`
                px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg 
                shadow-lg hover:bg-blue-700 hover:shadow-xl 
                focus:ring-4 focus:ring-blue-200 transition transform active:scale-95 
                flex items-center gap-2
                ${isSubmitting ? 'opacity-70 cursor-wait' : ''}
            `}
        >
            {isSubmitting ? (
                <>
                    <Spinner size="sm" color="white" />
                    Đang lưu...
                </>
            ) : (
                <>
                    <FaSave /> Lưu thay đổi
                </>
            )}
        </button>
    </div>
);

/**
 * Section title
 */
const SectionTitle = ({ children }) => (
    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        {children}
    </h4>
);

/**
 * Read-only field
 */
const ReadOnlyField = ({ label, value, icon }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
        </label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {icon}
            </div>
            <input
                type="text"
                value={value || ''}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-transparent rounded-lg text-gray-500 cursor-not-allowed text-sm focus:outline-none font-medium"
            />
        </div>
    </div>
);

export default ProfileForm;