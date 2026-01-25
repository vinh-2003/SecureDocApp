package com.securedoc.backend.controller;

import com.securedoc.backend.dto.admin.AdminDocStatsResponse;
import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.enums.EFileStatus;
import com.securedoc.backend.enums.EFileType;
import com.securedoc.backend.payload.response.ApiResponse;
import com.securedoc.backend.repository.FileNodeRepository;
import com.securedoc.backend.service.AdminDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/documents")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDocumentController {

    private final AdminDocumentService adminDocumentService;
    private final FileNodeRepository fileNodeRepository; // Inject trực tiếp để gọi query đơn giản

    // 1. Lấy thống kê tổng quan (Dashboard)
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminDocStatsResponse>> getDocumentStats() {
        AdminDocStatsResponse stats = adminDocumentService.getDocumentStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // 2. Lấy danh sách file bị lỗi (FAILED) để xử lý sự cố
    @GetMapping("/failed")
    public ResponseEntity<ApiResponse<Page<FileNode>>> getFailedFiles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        // Gọi trực tiếp Repo cho nhanh gọn
        Page<FileNode> failedFiles = fileNodeRepository.findByStatusAndTypeAndIsDeletedFalse(
                EFileStatus.FAILED,
                EFileType.FILE,
                PageRequest.of(page, size, Sort.by("updatedAt").descending())
        );
        return ResponseEntity.ok(ApiResponse.success(failedFiles));
    }
}