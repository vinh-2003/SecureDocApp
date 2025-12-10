package com.securedoc.backend.controller;

import com.securedoc.backend.dto.file.*;
import com.securedoc.backend.payload.response.ApiResponse;
import com.securedoc.backend.security.services.UserDetailsImpl;
import com.securedoc.backend.service.FileShareService;
import com.securedoc.backend.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class FileController {

    private final FileStorageService fileStorageService;
    private final FileShareService fileShareService;

    // ==================================================================
    // 1. CÁC API QUẢN LÝ FILE CƠ BẢN (CREATE, UPLOAD, DOWNLOAD)
    // ==================================================================

    /**
     * TẠO THƯ MỤC MỚI
     * POST /api/files/folder
     */
    @PostMapping("/folder")
    public ResponseEntity<ApiResponse<FileResponse>> createFolder(@Valid @RequestBody FolderCreateRequest request) {
        String userId = getCurrentUserId();
        FileResponse response = fileStorageService.createFolder(request, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Tạo thư mục thành công"));
    }

    /**
     * UPLOAD FILE
     * POST /api/files/upload
     */
    @PostMapping(value = "/upload", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<FileResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @ModelAttribute FileMetadataRequest metadata
    ) throws Exception {
        String userId = getCurrentUserId();
        FileResponse response = fileStorageService.uploadFile(file, metadata, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Upload file thành công"));
    }

    /**
     * TẢI XUỐNG HOẶC XEM FILE
     * URL: /api/files/download/{id}?inline=true (Xem)
     * URL: /api/files/download/{id}             (Tải)
     */
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String id,
            @RequestParam(defaultValue = "false") boolean inline // Tham số mới
    ) throws Exception {

        String userId = getCurrentUserId(); // Bắt buộc Login

        // Gọi Service (Đã bao gồm logic Decrypt + Ghi Log Recent)
        FileDownloadResponse fileResponse = fileStorageService.downloadFile(id, userId);

        // Encode tên file tiếng Việt cho Header
        String encodedFileName = URLEncoder.encode(fileResponse.getFileName(), StandardCharsets.UTF_8.toString())
                .replaceAll("\\+", "%20");

        // Quyết định kiểu trả về (Attachment hay Inline)
        String dispositionType = inline ? "inline" : "attachment";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileResponse.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        dispositionType + "; filename*=UTF-8''" + encodedFileName)
                .body(fileResponse.getStream());
    }

    // ==================================================================
    // 2. CÁC API VỀ PHÂN QUYỀN (PERMISSION & SHARING)
    // ==================================================================

    /**
     * CHIA SẺ FILE/FOLDER
     * POST /api/files/{id}/share
     */
    @PostMapping("/{id}/share")
    public ResponseEntity<ApiResponse<String>> shareFile(
            @PathVariable String id,
            @Valid @RequestBody ShareFileRequest request) {

        String userId = getCurrentUserId();
        fileShareService.shareFile(id, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã chia sẻ tài liệu thành công"));
    }

    /**
     * GỠ BỎ QUYỀN TRUY CẬP (REVOKE)
     * DELETE /api/files/{id}/share?email=...
     */
    @DeleteMapping("/{id}/share")
    public ResponseEntity<ApiResponse<String>> revokeAccess(
            @PathVariable String id,
            @RequestParam String email) {

        String userId = getCurrentUserId();
        fileShareService.revokeAccess(id, email, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã gỡ bỏ quyền truy cập"));
    }

    /**
     * THAY ĐỔI QUYỀN PUBLIC (General Access)
     * PUT /api/files/{id}/public
     */
    @PutMapping("/{id}/public")
    public ResponseEntity<ApiResponse<String>> changePublicAccess(
            @PathVariable String id,
            @Valid @RequestBody PublicAccessRequest request) {

        String userId = getCurrentUserId();
        fileShareService.changePublicAccess(id, request.getAccessLevel(), userId);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật quyền truy cập chung"));
    }

    // ==================================================================
    // HELPER METHODS
    // ==================================================================

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        throw new RuntimeException("Unauthorized: Không tìm thấy thông tin người dùng");
    }
}