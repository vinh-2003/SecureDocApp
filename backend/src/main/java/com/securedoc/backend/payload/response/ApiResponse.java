package com.securedoc.backend.payload.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Field nào null thì không trả về JSON
public class ApiResponse<T> {

    @Builder.Default
    private boolean success = true; // Trạng thái: true/false

    private String message; // Thông báo (VD: "Upload thành công")

    private T data; // Dữ liệu chính (Object, List,...)

    private Integer errorCode; // Mã lỗi nghiệp vụ (nếu có)

    // --- Constructor nhanh cho trường hợp thành công ---
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    // --- Constructor nhanh cho trường hợp lỗi ---
    public static <T> ApiResponse<T> error(String message, Integer errorCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .build();
    }
}