package com.securedoc.backend.enums;

public enum EFileStatus {
    PENDING,    // Đã tạo metadata, chờ file
    PROCESSING, // Đang xử lý (mã hóa, bóc tách text)
    AVAILABLE,  // Sẵn sàng sử dụng
    FAILED      // Lỗi xử lý
}