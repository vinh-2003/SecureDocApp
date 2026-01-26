import React from 'react';

const ModalFooter = ({ onClose, isSubmitting }) => (
    <div className="flex justify-end gap-3 pt-4 mt-6 border-t bg-gray-50 -mx-6 px-6 -mb-6 py-4 rounded-b-xl">
        <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg border border-gray-300 transition font-medium disabled:opacity-50"
        >
            Hủy bỏ
        </button>
        <button
            type="submit"
            disabled={isSubmitting}
            className={`
                px-6 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium 
                shadow-md hover:bg-blue-700 active:scale-95 transition-all
                disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2
            `}
        >
            {isSubmitting ? (
                <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    <span>Đang xử lý...</span>
                </>
            ) : (
                'Lưu thay đổi'
            )}
        </button>
    </div>
);

export default ModalFooter;