package com.securedoc.backend.controller;

import com.securedoc.backend.dto.admin.AccessLogResponse;
import com.securedoc.backend.payload.response.ApiResponse;
import com.securedoc.backend.service.AccessLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/access-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Chỉ Admin mới xem được
public class AccessLogController {

    private final AccessLogService accessLogService;

    // GET /api/admin/access-logs?page=0&size=20&keyword=admin&action=LOGIN
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AccessLogResponse>>> getAccessLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "ALL") String action // LOGIN, LOGOUT, REFRESH_TOKEN...
    ) {
        Page<AccessLogResponse> logs = accessLogService.getAccessLogs(page, size, keyword, action);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}