import React from 'react';

// Components
import { Loading } from '../../components/Common';
import {
    ProfileHeader,
    ProfileCard,
    ProfileForm
} from '../../components/Profile';

// Hooks
import { useProfile } from '../../hooks';

/**
 * =============================================================================
 * PROFILE PAGE
 * =============================================================================
 * Trang quản lý thông tin cá nhân của user
 * =============================================================================
 */
const ProfilePage = () => {
    const {
        loading,
        profile,
        previewImage,
        isSubmitting,
        form,
        handleImageChange,
        handleCancel,
        handleSubmit
    } = useProfile();

    const { register, handleSubmit: formHandleSubmit, formState: { errors } } = form;

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loading text="Đang tải thông tin..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-10 animate-fade-in">
            {/* Header Cover */}
            <ProfileHeader />

            {/* Main Content */}
            <div className="container mx-auto px-4 -mt-20 relative z-10 max-w-5xl">
                <form
                    onSubmit={formHandleSubmit(handleSubmit)}
                    className="flex flex-col md:flex-row gap-6"
                >
                    {/* Left Column:  Identity Card */}
                    <div className="w-full md:w-1/3">
                        <ProfileCard
                            profile={profile}
                            previewImage={previewImage}
                            avatarInputProps={register('avatar')}
                            onImageChange={handleImageChange}
                        />
                    </div>

                    {/* Right Column: Edit Form */}
                    <div className="w-full md:w-2/3">
                        <ProfileForm
                            profile={profile}
                            register={register}
                            errors={errors}
                            isSubmitting={isSubmitting}
                            onCancel={handleCancel}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;