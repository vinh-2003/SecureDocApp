import React from 'react';
import { FaTimes, FaCheck, FaLockOpen } from 'react-icons/fa';

// Components
import { Spinner } from '../Common/Loading';
import PageSelector from './PageSelector';
import ReasonInput from './ReasonInput';

// Hooks
import { useAccessRequest } from '../../hooks';

/**
 * =============================================================================
 * REQUEST ACCESS MODAL
 * =============================================================================
 * Modal cho phép user gửi yêu cầu mở khóa các trang bị khóa
 * 
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {Function} onClose - Callback đóng modal
 * @param {string} fileId - ID của file
 * @param {Array} pages - Danh sách tất cả các trang
 * =============================================================================
 */
const RequestAccessModal = ({ isOpen, onClose, fileId, pages = [] }) => {
    // Hook quản lý logic
    const {
        selectedPages,
        reason,
        loading,
        lockedPages,
        hasLockedPages,
        selectedCount,
        isAllSelected,
        setReason,
        togglePage,
        selectAll,
        deselectAll,
        submit
    } = useAccessRequest(fileId, pages, isOpen, onClose);

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        await submit();
    };

    // Handle overlay click
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !loading) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleOverlayClick}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-down"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <ModalHeader onClose={onClose} disabled={loading} />

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Page Selector */}
                    <PageSelector
                        pages={lockedPages}
                        selectedPages={selectedPages}
                        onToggle={togglePage}
                        onSelectAll={selectAll}
                        onDeselectAll={deselectAll}
                        selectedCount={selectedCount}
                        isAllSelected={isAllSelected}
                    />

                    {/* Reason Input */}
                    <ReasonInput
                        value={reason}
                        onChange={setReason}
                    />

                    {/* Action Buttons */}
                    <ModalFooter
                        loading={loading}
                        disabled={!hasLockedPages}
                        onCancel={onClose}
                    />
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
const ModalHeader = ({ onClose, disabled }) => (
    <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
                <FaLockOpen className="text-blue-600" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800">Yêu cầu mở khóa</h3>
                <p className="text-xs text-gray-500">Gửi yêu cầu xem các trang bị khóa</p>
            </div>
        </div>
        <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
            aria-label="Đóng"
        >
            <FaTimes size={18} />
        </button>
    </div>
);

/**
 * Modal Footer với action buttons
 */
const ModalFooter = ({ loading, disabled, onCancel }) => (
    <div className="flex justify-end gap-3 pt-2">
        <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
            Hủy bỏ
        </button>
        <button
            type="submit"
            disabled={loading || disabled}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? (
                <>
                    <Spinner size="sm" color="white" />
                    Đang gửi...
                </>
            ) : (
                <>
                    <FaCheck size={12} />
                    Gửi yêu cầu
                </>
            )}
        </button>
    </div>
);

export default RequestAccessModal;