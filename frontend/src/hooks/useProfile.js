import { useState, useEffect, useContext, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import userService from '../services/userService';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook quản lý logic trang Profile
 * 
 * @returns {Object} State và handlers
 */
const useProfile = () => {
    const { updateUser } = useContext(AuthContext);

    // State
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form - Chỉ lấy những gì cần dùng
    const form = useForm();
    const { setValue } = form;

    // Fetch profile data
    const fetchProfile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await userService.getProfile();
            if (res.success) {
                setProfile(res.data);
                setValue('fullName', res.data.fullName);
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            toast.error('Không thể tải thông tin tài khoản');
        } finally {
            setLoading(false);
        }
    }, [setValue]);

    // Initial fetch
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Handle image change
    const handleImageChange = useCallback((e, formOnChange) => {
        const file = e.target.files?.[0];

        if (!file) return;

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            toast.error('Ảnh quá lớn! Vui lòng chọn ảnh dưới 50MB.');
            e.target.value = '';
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh hợp lệ.');
            e.target.value = '';
            return;
        }

        // Create preview
        setPreviewImage(URL.createObjectURL(file));

        // Update form state
        formOnChange?.(e);
    }, []);

    // Handle cancel
    const handleCancel = useCallback(() => {
        // Reset form to original values
        setValue('fullName', profile?.fullName);
        setValue('avatar', null);

        // Clear preview
        setPreviewImage(null);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [profile, setValue]);

    // Handle submit
    const handleSubmit = useCallback(async (data) => {
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('fullName', data.fullName.trim());

            if (data.avatar?.length > 0) {
                formData.append('avatar', data.avatar[0]);
            }

            const res = await userService.updateProfile(formData);

            if (res.success) {
                toast.success('Cập nhật hồ sơ thành công!');
                setProfile(res.data);
                setPreviewImage(null);

                // Update global user context
                updateUser({
                    fullName: res.data.fullName,
                    avatarUrl: res.data.avatarUrl
                });
            }
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error(error.response?.data?.message || 'Cập nhật thất bại.');
        } finally {
            setIsSubmitting(false);
        }
    }, [updateUser]);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewImage) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    return {
        // State
        loading,
        profile,
        previewImage,
        isSubmitting,

        // Form
        form,

        // Handlers
        handleImageChange,
        handleCancel,
        handleSubmit,
        refetch: fetchProfile
    };
};

export default useProfile;