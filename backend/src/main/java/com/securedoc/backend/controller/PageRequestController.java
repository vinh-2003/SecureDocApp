package com.securedoc.backend.controller;

import com.securedoc.backend.dto.request.CreatePageRequestDto;
import com.securedoc.backend.entity.PageAccessRequest;
import com.securedoc.backend.payload.response.ApiResponse;
import com.securedoc.backend.security.services.UserDetailsImpl;
import com.securedoc.backend.service.PageRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class PageRequestController {

    private final PageRequestService pageRequestService;

    // 1. Gửi yêu cầu mở trang
    @PostMapping
    public ResponseEntity<ApiResponse<String>> createRequest(@RequestBody CreatePageRequestDto dto) {
        String userId = getCurrentUserId();
        pageRequestService.createRequest(userId, dto.getFileId(), dto.getPageIndexes(), dto.getReason());
        return ResponseEntity.ok(ApiResponse.success("Đã gửi yêu cầu thành công"));
    }

    // 2. Lấy danh sách yêu cầu đang chờ (Dành cho Owner - Hiện ở Dashboard)
    @GetMapping("/managed")
    public ResponseEntity<ApiResponse<List<PageAccessRequest>>> getIncomingRequests() {
        String userId = getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(pageRequestService.getRequestsForOwner(userId)));
    }

    // 3. Duyệt yêu cầu (Approve/Reject)
    @PutMapping("/{requestId}/process")
    public ResponseEntity<ApiResponse<String>> processRequest(
            @PathVariable String requestId,
            @RequestParam boolean approved // true = APPROVE, false = REJECT
    ) {
        String userId = getCurrentUserId();
        pageRequestService.processRequest(requestId, userId, approved);
        return ResponseEntity.ok(ApiResponse.success(approved ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu"));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        throw new RuntimeException("Unauthorized: Không tìm thấy thông tin người dùng");
    }
}