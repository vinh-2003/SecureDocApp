package com.securedoc.backend.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.securedoc.backend.dto.request.ActivityFilterRequest;
import com.securedoc.backend.dto.response.ActivityLogPageResponse;
import com.securedoc.backend.dto.response.ActivityLogResponse;
import com.securedoc.backend.enums.EActivityType;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.payload.response.ApiResponse;
import com.securedoc.backend.security.services.UserDetailsImpl;
import com.securedoc.backend.service.ActivityLogService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class ActivityController {

    private final ActivityLogService activityLogService;

    // ===================================================================
    // 1. LẤY ACTIVITY CỦA MỘT FILE/FOLDER
    // ===================================================================
    /**
     * Lấy lịch sử hoạt động của một file/folder. Nếu là folder sẽ bao gồm cả
     * hoạt động của con cháu.
     *
     * GET /api/activities/node/{nodeId}? page=0&size=20
     */
    @GetMapping("/node/{nodeId}")
    public ResponseEntity<ApiResponse<ActivityLogPageResponse>> getNodeActivities(
            @PathVariable String nodeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) List<EActivityType> actionTypes,
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate
    ) {
        String currentUserId = getCurrentUserId();

        ActivityFilterRequest filter = ActivityFilterRequest.builder()
                .page(page)
                .size(size)
                .actionTypes(actionTypes)
                .actorId(actorId)
                .fromDate(fromDate)
                .toDate(toDate)
                .build();

        ActivityLogPageResponse response = activityLogService.getActivitiesByNode(
                nodeId, currentUserId, filter
        );

        return ResponseEntity.ok(ApiResponse.success(response, "Lấy lịch sử hoạt động thành công"));
    }

    // ===================================================================
    // 2. LẤY ACTIVITY CỦA CURRENT USER (My Activity)
    // ===================================================================
    /**
     * Lấy lịch sử hoạt động do user hiện tại thực hiện.
     *
     * GET /api/activities/me? page=0&size=20
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ActivityLogPageResponse>> getMyActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String currentUserId = getCurrentUserId();

        ActivityLogPageResponse response = activityLogService.getMyActivities(
                currentUserId, page, size
        );

        return ResponseEntity.ok(ApiResponse.success(response, "Lấy hoạt động của tôi thành công"));
    }

    // ===================================================================
    // 3. LẤY ACTIVITY GẦN ĐÂY (Dashboard)
    // ===================================================================
    /**
     * Lấy các hoạt động gần đây trên toàn hệ thống (cho Dashboard).
     *
     * GET /api/activities/recent?limit=10
     */
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<ActivityLogResponse>>> getRecentActivities(
            @RequestParam(defaultValue = "10") int limit
    ) {
        String currentUserId = getCurrentUserId();

        List<ActivityLogResponse> activities = activityLogService.getRecentActivities(
                currentUserId, limit
        );

        return ResponseEntity.ok(ApiResponse.success(activities, "Lấy hoạt động gần đây thành công"));
    }

    // ===================================================================
    // HELPER
    // ===================================================================
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        throw new AppException(AppErrorCode.USER_NOT_FOUND);
    }
}
