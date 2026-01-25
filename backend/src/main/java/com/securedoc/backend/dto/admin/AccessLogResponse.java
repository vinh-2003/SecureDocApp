package com.securedoc.backend.dto.admin;

import com.securedoc.backend.enums.EAccessAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessLogResponse {
    private String id;
    private String username;    // Ai truy cập?
    private EAccessAction action; // Làm gì? (LOGIN, LOGOUT...)
    private boolean isSuccess;  // Thành công hay thất bại
    private String errorMessage; // Lý do lỗi (nếu có)
    private String ipAddress;   // IP nào?
    private String userAgent;   // Thiết bị gì?
    private LocalDateTime timestamp; // Khi nào?
}