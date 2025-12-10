package com.securedoc.backend.controller;

import com.securedoc.backend.dto.file.FileResponse;
import com.securedoc.backend.dto.file.SearchFileRequest;
import com.securedoc.backend.payload.response.ApiResponse;
import com.securedoc.backend.security.services.UserDetailsImpl;
import com.securedoc.backend.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

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

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();

        List<FileResponse> results = searchService.searchFiles(request, userDetails.getId());

        return ResponseEntity.ok(ApiResponse.success(results));
    }
}