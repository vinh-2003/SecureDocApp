import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import fileService from '../services/fileService';

/**
 * Hook xử lý logic tìm kiếm bằng hình ảnh
 * @returns {Object} { fileInputRef, isSearching, triggerUpload, handleFileChange }
 */
const useImageSearch = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null); // Ref để kích hoạt input file ẩn
    const [isSearching, setIsSearching] = useState(false);

    /**
     * Hàm kích hoạt hộp thoại chọn file
     */
    const triggerUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    /**
     * Xử lý khi người dùng đã chọn file ảnh
     */
    const handleFileChange = useCallback(async (e) => {
        const file = e.target.files?.[0];

        // 1. Validate cơ bản
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn định dạng ảnh (jpg, png, webp...)');
            return;
        }

        // Giới hạn dung lượng client-side (VD: 100MB) để tránh treo browser khi resize
        if (file.size > 100 * 1024 * 1024) {
            toast.error('File ảnh quá lớn (Tối đa 100MB)');
            return;
        }

        setIsSearching(true);
        const toastId = toast.loading("Đang phân tích hình ảnh...");

        try {
            // 2. Gọi API Search Image (Backend đã lo resize)
            const res = await fileService.searchByImage(file);

            if (res.success) {
                toast.update(toastId, {
                    render: `Đã tìm thấy ${res.data.length} kết quả tương đồng!`,
                    type: "success",
                    isLoading: false,
                    autoClose: 2000
                });

                // 3. Chuyển hướng sang trang Search
                // Truyền kết quả qua `location.state` để không lộ trên URL và giữ data phức tạp
                navigate('/search', {
                    state: {
                        imageResults: res.data,
                        searchType: 'IMAGE',
                        imageName: file.name,
                        imagePreview: URL.createObjectURL(file) // (Optional) Để hiện ảnh thumbnail đã chọn
                    }
                });
            } else {
                toast.update(toastId, {
                    render: "Không tìm thấy kết quả nào.",
                    type: "info",
                    isLoading: false,
                    autoClose: 3000
                });
            }

        } catch (error) {
            console.error("Image search error:", error);
            toast.update(toastId, {
                render: "Lỗi khi tìm kiếm hình ảnh. Vui lòng thử lại.",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        } finally {
            setIsSearching(false);
            // Reset input để có thể chọn lại đúng file đó nếu muốn
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [navigate]);

    return {
        fileInputRef,
        isSearching,
        triggerUpload,
        handleFileChange
    };
};

export default useImageSearch;