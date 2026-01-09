import React, { useState, useEffect } from 'react';
import fileService from '../../services/fileService';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const SecureImage = ({ pageId, className, alt }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const fetchImage = async () => {
            try {
                // Gọi API lấy Blob
                const response = await fileService.getPageImage(pageId);
                
                // Tạo URL cục bộ từ Blob (VD: blob:http://localhost:3000/xyz...)
                const url = URL.createObjectURL(response);
                
                if (isMounted) {
                    setImageUrl(url);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error loading image:", err);
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        if (pageId) fetchImage();

        // Cleanup: Xoá URL blob khi component unmount để tránh leak memory
        return () => {
            isMounted = false;
            if (imageUrl) URL.revokeObjectURL(imageUrl);
        };
        // eslint-disable-next-line
    }, [pageId]);

    if (loading) {
        return <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
            <FaSpinner className="animate-spin" size={24} />
        </div>;
    }

    if (error) {
        return <div className={`flex flex-col items-center justify-center bg-gray-100 text-red-400 ${className}`}>
            <FaExclamationTriangle size={24} />
            <span className="text-xs mt-1">Lỗi tải ảnh</span>
        </div>;
    }

    return <img src={imageUrl} alt={alt} className={className} />;
};

export default SecureImage;