package com.securedoc.backend.controller;

import com.securedoc.backend.dto.file.FileResponse;
import com.securedoc.backend.dto.file.SearchFileRequest;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.payload.response.ApiResponse;
import com.securedoc.backend.security.services.UserDetailsImpl;
import com.securedoc.backend.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class SearchController {

    private final SearchService searchService;

    /**
     * API TÌM KIẾM NÂNG CAO
     * Method: GET
     * URL Example:
     * /api/search?keyword=hợp đồng&fileType=pdf&inTrash=false&fromDate=2024-01-01
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FileResponse>>> searchFiles(
            @ModelAttribute SearchFileRequest request // Tự động map query params vào DTO
    ) {
        String userId = getCurrentUserId();
        List<FileResponse> results = searchService.searchFiles(request, userId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    /**
     * [MỚI] API 1: TÌM KIẾM NGỮ NGHĨA (AI Semantic Search)
     * URL: /api/search/semantic?query=con meo&limit=10
     */
    @GetMapping("/semantic")
    public ResponseEntity<ApiResponse<List<FileResponse>>> searchBySemantic(
            @RequestParam("query") String query,
            @RequestParam(value = "limit", defaultValue = "10") int limit
    ) {
        String userId = getCurrentUserId();
        List<FileResponse> results = searchService.searchBySemantics(query, limit, userId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    /**
     * [MỚI] API 2: TÌM KIẾM BẰNG HÌNH ẢNH (Image Search)
     * URL: /api/search/image (Method: POST, Body: form-data "file")
     */
    @PostMapping("/image")
    public ResponseEntity<ApiResponse<List<FileResponse>>> searchByImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "limit", defaultValue = "10") int limit
    ) {
        String userId = getCurrentUserId();
        List<FileResponse> results = searchService.searchByImage(file, limit, userId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        throw new AppException(AppErrorCode.USER_NOT_FOUND);
    }
}