package com.securedoc.backend.exception;

import com.securedoc.backend.payload.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 1. Xử lý lỗi nghiệp vụ (AppException)
     * Đây là phần được tối ưu: Status code động theo từng lỗi
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        AppErrorCode errorCode = ex.getErrorCode();

        return ResponseEntity
                .status(errorCode.getStatusCode()) // Tự động set 404, 403, 401...
                .body(ApiResponse.error(
                        errorCode.getMessage(),
                        errorCode.getCode()
                ));
    }

    /**
     * 2. Xử lý lỗi Validate (@NotBlank, @Size...)
     * Mặc định trả về 400 Bad Request
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {

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
                        .errorCode(400) // Mã lỗi chung cho validate
                        .data(errors)
                        .build());
    }

    /**
     * 3. Xử lý các lỗi RuntimeException khác (NullPointer,...)
     * Mặc định trả về 500 Internal Server Error
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        // Log lỗi ra console để dev fix (Production nên dùng Logger)
        ex.printStackTrace();

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(
                        AppErrorCode.UNCATEGORIZED_EXCEPTION.getMessage() + ": " + ex.getMessage(),
                        AppErrorCode.UNCATEGORIZED_EXCEPTION.getCode()
                ));
    }
}