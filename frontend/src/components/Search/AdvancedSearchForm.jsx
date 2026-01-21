import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { FaTimes } from 'react-icons/fa';

// Components
import { UserSearchInput, FolderSelect, DateRangeInput } from '.';

// Hooks
import { useUserSearch, useFolderList } from '../../hooks';

/**
 * =============================================================================
 * ADVANCED SEARCH FORM
 * =============================================================================
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_VALUES = {
    keyword: '',
    fileType: '',
    ownerId: '',
    fromDate: '',
    toDate: '',
    locationId: '',
    inTrash: false
};

const FILE_TYPE_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'FOLDER', label: 'Thư mục' },
    { value: 'pdf', label: 'PDF (. pdf)' },
    { value: 'docx', label: 'Word (. docx)' },
    { value: 'xlsx', label: 'Excel (.xlsx)' },
    { value: 'jpg', label: 'Ảnh (.jpg)' }
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const AdvancedSearchForm = ({ onClose, onApply, initialValues }) => {
    // Form
    const { register, handleSubmit, setValue, reset, watch } = useForm({
        defaultValues: { ...DEFAULT_VALUES, ...initialValues }
    });

    // Watch form values
    const formValues = watch();

    // Folder list hook
    const { folderOptions, loading: loadingFolders, getFolderById } = useFolderList();

    // User search hook
    const userSearch = useUserSearch({
        initialUserId: initialValues?.ownerId,
        onUserChange: useCallback((userId) => {
            setValue('ownerId', userId);
        }, [setValue])
    });

    // === HANDLERS ===

    // Submit form
    const onSubmit = (data) => {
        // Lấy tên folder để hiển thị
        const selectedFolder = data.locationId ? getFolderById(data.locationId) : null;
        const folderName = selectedFolder?.name || '';

        // Lấy tên owner để hiển thị
        const ownerName = userSearch.foundUser
            ? (userSearch.foundUser.fullName || userSearch.foundUser.username)
            : userSearch.searchEmail || '';

        // Build search request
        const searchRequest = {
            keyword: data.keyword,
            fileType: data.fileType,
            ownerId: data.ownerId,
            fromDate: data.fromDate,
            toDate: data.toDate,
            locationId: data.locationId,
            inTrash: data.inTrash || false,
            // Display names cho Filter Chips
            ownerDisplayName: ownerName,
            locationDisplayName: folderName
        };

        onApply(searchRequest);
        onClose();
    };

    // Reset form - SỬA:  Phải reset cả userSearch
    const handleReset = () => {
        // Reset form values
        reset(DEFAULT_VALUES);

        // Reset user search state
        userSearch.reset();

        // Đảm bảo ownerId trong form cũng được reset
        setValue('ownerId', '');
    };

    // Handle overlay click
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
            onClick={handleOverlayClick}
        >
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <ModalHeader onClose={onClose} />

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    {/* Keyword */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            Từ khóa
                        </label>
                        <input
                            {...register('keyword')}
                            placeholder="Nhập tên file, nội dung..."
                            autoFocus
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                        />
                    </div>

                    {/* File Type & Folder */}
                    <div className="grid grid-cols-2 gap-5">
                        {/* File Type */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Loại tài liệu
                            </label>
                            <select
                                {...register('fileType')}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                {FILE_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Folder */}
                        <FolderSelect
                            value={formValues.locationId}
                            onChange={(e) => setValue('locationId', e.target.value)}
                            options={folderOptions}
                            loading={loadingFolders}
                        />
                    </div>

                    {/* Owner Search */}
                    <UserSearchInput
                        searchEmail={userSearch.searchEmail}
                        onSearchChange={userSearch.setSearchEmail}
                        foundUser={userSearch.foundUser}
                        isLoading={userSearch.isLoading}
                        error={userSearch.error}
                        onClear={userSearch.clearUser}
                        disabled={userSearch.isRestoring}
                    />

                    {/* Hidden input for ownerId */}
                    <input type="hidden" {...register('ownerId')} />

                    {/* Date Range */}
                    <DateRangeInput
                        fromDate={formValues.fromDate}
                        toDate={formValues.toDate}
                        onFromChange={(e) => setValue('fromDate', e.target.value)}
                        onToChange={(e) => setValue('toDate', e.target.value)}
                    />

                    {/* In Trash Checkbox */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="inTrash"
                            {...register('inTrash')}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label
                            htmlFor="inTrash"
                            className="text-sm text-gray-700 cursor-pointer select-none"
                        >
                            Tìm trong thùng rác
                        </label>
                    </div>

                    {/* Footer */}
                    <ModalFooter onReset={handleReset} />
                </form>
            </div>
        </div>
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Modal Header
 */
const ModalHeader = ({ onClose }) => (
    <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
        <h3 className="text-lg font-bold text-gray-800">
            Tìm kiếm nâng cao
        </h3>
        <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition"
            aria-label="Đóng"
        >
            <FaTimes size={18} />
        </button>
    </div>
);

/**
 * Modal Footer
 */
const ModalFooter = ({ onReset }) => (
    <div className="flex justify-end gap-3 pt-4 border-t mt-2">
        <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded border border-gray-300 transition font-medium"
        >
            Đặt lại
        </button>
        <button
            type="submit"
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-lg transition transform hover:-translate-y-0.5"
        >
            Áp dụng
        </button>
    </div>
);

export default AdvancedSearchForm;