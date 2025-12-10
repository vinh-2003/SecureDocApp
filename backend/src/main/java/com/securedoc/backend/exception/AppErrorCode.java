package com.securedoc.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum AppErrorCode {
    // --- 1xxx: Lỗi User & Auth ---
    USER_NOT_FOUND(1001, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    USER_EXISTED(1002, "Username đã tồn tại", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1003, "Email đã tồn tại", HttpStatus.BAD_REQUEST),

    // 401 Unauthorized: Chưa đăng nhập hoặc sai pass
    INVALID_CREDENTIALS(1004, "Username hoặc Password không đúng", HttpStatus.UNAUTHORIZED),

    ACCOUNT_LOCKED(1005, "Tài khoản đã bị khóa", HttpStatus.FORBIDDEN),
    UNAUTHENTICATED(1006, "Vui lòng đăng nhập", HttpStatus.UNAUTHORIZED),

    // --- 2xxx: Lỗi File/Folder ---
    FILE_NOT_FOUND(2001, "Không tìm thấy tài liệu hoặc thư mục", HttpStatus.NOT_FOUND),

    // 403 Forbidden: Đã đăng nhập nhưng không có quyền
    FILE_ACCESS_DENIED(2002, "Bạn không có quyền truy cập tài liệu này", HttpStatus.FORBIDDEN),

    FILE_NAME_EXISTED(2003, "Tên file hoặc thư mục đã tồn tại", HttpStatus.BAD_REQUEST),
    PARENT_NOT_FOUND(2004, "Thư mục cha không tồn tại", HttpStatus.NOT_FOUND),
    PARENT_IS_NOT_FOLDER(2005, "Node cha không phải là thư mục", HttpStatus.BAD_REQUEST),
    FILE_EXTENSION_NOT_SUPPORTED(2006, "Định dạng file không hỗ trợ", HttpStatus.BAD_REQUEST),

    // --- 9xxx: Lỗi Hệ thống ---
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống chưa xác định", HttpStatus.INTERNAL_SERVER_ERROR);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode; // <-- Trường mới thêm

    AppErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}