package com.securedoc.backend.service;

import com.securedoc.backend.entity.AccessLog;
import com.securedoc.backend.enums.EAccessAction;
import com.securedoc.backend.repository.AccessLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import com.securedoc.backend.dto.admin.AccessLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccessLogService {

    private final AccessLogRepository accessLogRepository;

    /**
     * Ghi log truy cập (Chạy Async để không làm chậm request chính)
     */
    @Async
    public void logAccess(
            String userId, String username, EAccessAction action, boolean isSuccess, String errorMessage,
            String ipAddress, String userAgent
    ) {
        try {
            AccessLog logEntry = AccessLog.builder()
                    .userId(userId)
                    .username(username)
                    .action(action)
                    .isSuccess(isSuccess)
                    .errorMessage(errorMessage)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .timestamp(LocalDateTime.now())
                    .build();

            accessLogRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Không thể ghi log truy cập: {}", e.getMessage());
        }
    }

    // --- HELPER: Lấy IP Address ---
    public String getClientIp() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return "Unknown";

            HttpServletRequest request = attributes.getRequest();
            String remoteAddr = "";

            if (request != null) {
                remoteAddr = request.getHeader("X-FORWARDED-FOR");
                if (remoteAddr == null || "".equals(remoteAddr)) {
                    remoteAddr = request.getRemoteAddr();
                }
            }
            return remoteAddr;
        } catch (Exception e) {
            return "Unknown";
        }
    }

    public Page<AccessLogResponse> getAccessLogs(
            int page,
            int size,
            String keyword,
            String actionStr // Nhận String từ Controller để dễ xử lý null/empty
    ) {
        // 1. Tạo Pageable (Luôn sắp xếp mới nhất lên đầu)
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());

        Page<AccessLog> logPage;
        EAccessAction actionParam = null;

        // 2. Parse Action Enum (nếu có)
        if (actionStr != null && !actionStr.isEmpty() && !actionStr.equals("ALL")) {
            try {
                actionParam = EAccessAction.valueOf(actionStr);
            } catch (IllegalArgumentException e) {
                // Nếu FE gửi action sai, coi như không lọc theo action
            }
        }

        // 3. Logic gọi Repository
        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();
        boolean hasAction = actionParam != null;

        if (hasKeyword && hasAction) {
            logPage = accessLogRepository.searchLogsWithAction(keyword, actionParam, pageable);
        } else if (hasKeyword) {
            logPage = accessLogRepository.searchLogs(keyword, pageable);
        } else if (hasAction) {
            logPage = accessLogRepository.findByAction(actionParam, pageable);
        } else {
            // Không lọc gì cả
            logPage = accessLogRepository.findAll(pageable);
        }

        // 4. Map Entity sang DTO
        return logPage.map(this::convertToDto);
    }

    private AccessLogResponse convertToDto(AccessLog log) {
        return AccessLogResponse.builder()
                .id(log.getId())
                .username(log.getUsername())
                .action(log.getAction())
                .isSuccess(log.isSuccess())
                .errorMessage(log.getErrorMessage())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .timestamp(log.getTimestamp())
                .build();
    }

    // --- HELPER: Lấy User Agent ---
    public String getUserAgent() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return "Unknown";

            HttpServletRequest request = attributes.getRequest();
            return request.getHeader("User-Agent");
        } catch (Exception e) {
            return "Unknown";
        }
    }
}