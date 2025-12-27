package com.securedoc.backend.exception;

import com.securedoc.backend.payload.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 1. Xử lý lỗi nghiệp vụ (AppException)
     * Lấy status code và error code động từ Enum AppErrorCode
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        AppErrorCode errorCode = ex.getErrorCode();

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(ApiResponse.error(
                        errorCode.getMessage(),
                        errorCode.getCode()
                ));
    }

    /**
     * 2. Xử lý lỗi Validate (@NotBlank, @Size...)
     * Trả về danh sách các field bị lỗi và message tương ứng
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return ResponseEntity
                .badRequest()
                .body(ApiResponse.<Map<String, String>>builder()
                        .success(false)
                        .message("Dữ liệu đầu vào không hợp lệ")
                        .errorCode(HttpStatus.BAD_REQUEST.value())
                        .data(errors)
                        .build());
    }

    // ========================================================================
    // 3. XỬ LÝ CÁC LỖI BẢO MẬT (SECURITY EXCEPTIONS)
    // ========================================================================

    /**
     * Đăng nhập thất bại (Sai username hoặc password)
     * Code: 1004
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentialsException(BadCredentialsException e) {
        return ResponseEntity
                .status(AppErrorCode.INVALID_CREDENTIALS.getStatusCode())
                .body(ApiResponse.error(
                        AppErrorCode.INVALID_CREDENTIALS.getMessage(),
                        AppErrorCode.INVALID_CREDENTIALS.getCode()
                ));
    }

    /**
     * Tài khoản bị khóa (Do nhập sai quá nhiều lần)
     * Code: 1005
     */
    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiResponse<Void>> handleLockedException(LockedException e) {
        return ResponseEntity
                .status(AppErrorCode.ACCOUNT_LOCKED.getStatusCode())
                .body(ApiResponse.error(
                        AppErrorCode.ACCOUNT_LOCKED.getMessage(),
                        AppErrorCode.ACCOUNT_LOCKED.getCode()
                ));
    }

    /**
     * Tài khoản chưa kích hoạt (Chưa verify email)
     * Code: 1007
     */
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiResponse<Void>> handleDisabledException(DisabledException e) {
        return ResponseEntity
                .status(AppErrorCode.ACCOUNT_NOT_ENABLED.getStatusCode())
                .body(ApiResponse.error(
                        AppErrorCode.ACCOUNT_NOT_ENABLED.getMessage(),
                        AppErrorCode.ACCOUNT_NOT_ENABLED.getCode()
                ));
    }

    @ExceptionHandler(TokenRefreshException.class)
    public ResponseEntity<ApiResponse<Object>> handleTokenRefreshException(TokenRefreshException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(
                        ex.getMessage(),
                        AppErrorCode.INVALID_TOKEN.getCode() // Hoặc tạo mã lỗi riêng như TOKEN_EXPIRED
                ));
    }

    // ========================================================================
    // 4. XỬ LÝ LỖI CHƯA ĐĂNG NHẬP
    // ========================================================================
    /**
     * Bắt lỗi AccessDeniedException
     * Trả về 401
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        AppErrorCode errorCode = AppErrorCode.UNAUTHORIZED;

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(ApiResponse.error(
                        errorCode.getMessage(),
                        errorCode.getCode()
                ));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Object>> handleMaxSizeException(MaxUploadSizeExceededException ex) {
        AppErrorCode errorCode = AppErrorCode.FILE_TOO_LARGE;

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(ApiResponse.error(
                        errorCode.getMessage(),
                        errorCode.getCode()
                ));
    }

    // ========================================================================
    // 4. XỬ LÝ LỖI KHÔNG XÁC ĐỊNH (FALLBACK)
    // ========================================================================

    /**
     * Bắt tất cả các lỗi còn lại (NullPointer, IndexOutOfBounds...)
     * Trả về 500 Internal Server Error
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleException(Exception ex) {
        // In log ra console để debug (Trong môi trường thật nên dùng Logger)
        ex.printStackTrace();

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(
                        AppErrorCode.UNCATEGORIZED_EXCEPTION.getMessage() + ": " + ex.getMessage(),
                        AppErrorCode.UNCATEGORIZED_EXCEPTION.getCode()
                ));
    }
}