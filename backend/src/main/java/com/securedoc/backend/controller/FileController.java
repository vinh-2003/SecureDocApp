package com.securedoc.backend.controller;

import com.mongodb.client.gridfs.model.GridFSFile;
import com.securedoc.backend.dto.file.*;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.payload.response.ApiResponse;
import com.securedoc.backend.security.services.UserDetailsImpl;
import com.securedoc.backend.service.FileShareService;
import com.securedoc.backend.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class FileController {

    private final FileStorageService fileStorageService;
    private final FileShareService fileShareService;
    private final GridFsTemplate gridFsTemplate;

    // ==================================================================
    // 1. CÁC API QUẢN LÝ FILE CƠ BẢN (CREATE, UPLOAD, DOWNLOAD)
    // ==================================================================

    /**
     * TẠO THƯ MỤC
     */
    @PostMapping("/folder")
    public ResponseEntity<ApiResponse<FileResponse>> createFolder(@Valid @RequestBody FolderCreateRequest request) {
        try {
            String userId = getCurrentUserId();
            FileResponse response = fileStorageService.createFolder(request, userId);
            return ResponseEntity.ok(ApiResponse.success(response, "Tạo thư mục thành công"));
        } catch (AppException e) {
            if (e.getErrorCode() == AppErrorCode.FOLDER_NAME_EXISTED) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Thư mục đã tồn tại", e.getErrorCode().getCode()));
            }
            throw e;
        }
    }

    /**
     * UPLOAD BATCH
     */
    @PostMapping(value = "/upload/batch", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<BatchUploadResponse>> uploadBatch(
            @RequestParam("files") MultipartFile[] files,
            @ModelAttribute FileMetadataRequest metadata
    ) {
        String userId = getCurrentUserId();
        // Logic vòng lặp đã chuyển sang Service
        BatchUploadResponse report = fileStorageService.uploadBatch(files, metadata, userId);

        String message = "Hoàn tất xử lý " + report.getTotalFiles() + " tệp.";
        return ResponseEntity.ok(ApiResponse.success(report, message));
    }

    /**
     * UPLOAD FOLDER
     */
    @PostMapping(value = "/upload/folder", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<BatchUploadResponse>> uploadFolder(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("paths") String[] paths,
            @ModelAttribute FileMetadataRequest metadata
    ) {
        String userId = getCurrentUserId();
        BatchUploadResponse report = fileStorageService.uploadFolder(files, paths, metadata, userId);

        String message = "Đã xử lý tải lên thư mục: " + report.getSuccessCount() + " thành công.";
        return ResponseEntity.ok(ApiResponse.success(report, message));
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

    /**
     * ĐỔI TÊN THƯ MỤC
     * PUT /api/files/folders/{id}/rename
     */
    @PutMapping("/folders/{id}/rename")
    public ResponseEntity<ApiResponse<FileResponse>> renameFolder(
            @PathVariable String id,
            @RequestBody @Valid FolderRenameRequest request // Dùng DTO mới
    ) {
        String userId = getCurrentUserId();
        // Trim() tên thư mục để loại bỏ khoảng trắng thừa đầu đuôi
        String cleanName = request.getNewName().trim();

        FileResponse response = fileStorageService.renameFolder(id, cleanName, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Đổi tên thư mục thành công"));
    }

    /**
     * ĐỔI TÊN FILE
     * PUT /api/files/files/{id}/rename
     */
    @PutMapping("/files/{id}/rename")
    public ResponseEntity<ApiResponse<FileResponse>> renameFile(
            @PathVariable String id,
            @RequestBody @Valid FileRenameRequest request
    ) {
        String userId = getCurrentUserId();
        String cleanName = request.getNewName().trim();

        FileResponse response = fileStorageService.renameFile(id, cleanName, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Đổi tên tệp thành công"));
    }

    /**
     * CẬP NHẬT MÔ TẢ THƯ MỤC
     * PUT /api/files/folders/{id}/description
     */
    @PutMapping("/folders/{id}/description")
    public ResponseEntity<ApiResponse<FileResponse>> updateFolderDescription(
            @PathVariable String id,
            @RequestBody @Valid FileDescriptionRequest request
    ) {
        String userId = getCurrentUserId();
        // Gọi chung 1 hàm service vì logic giống nhau
        FileResponse response = fileStorageService.updateDescription(id, request.getDescription(), userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật mô tả thành công"));
    }

    /**
     * CẬP NHẬT MÔ TẢ TỆP TIN
     * PUT /api/files/files/{id}/description
     */
    @PutMapping("/files/{id}/description")
    public ResponseEntity<ApiResponse<FileResponse>> updateFileDescription(
            @PathVariable String id,
            @RequestBody @Valid FileDescriptionRequest request
    ) {
        String userId = getCurrentUserId();
        FileResponse response = fileStorageService.updateDescription(id, request.getDescription(), userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật mô tả thành công"));
    }

    /**
     * LẤY THÔNG TIN CHI TIẾT FILE/FOLDER
     * GET /api/files/{id}/details
     */
    @GetMapping("/{id}/details")
    public ResponseEntity<ApiResponse<FileDetailResponse>> getFileDetails(@PathVariable String id) {
        String userId = getCurrentUserId();
        FileDetailResponse response = fileStorageService.getFileDetails(id, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin thành công"));
    }

    // ==================================================================
    // --- THÊM MỚI API CHO DASHBOARD ---
    // ==================================================================

    /**
     * THỐNG KÊ DASHBOARD
     * GET /api/files/dashboard/stats
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        String userId = getCurrentUserId();
        DashboardStatsResponse stats = fileStorageService.getDashboardStats(userId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * LẤY DANH SÁCH FILE TRANG CHỦ (ROOT)
     * GET /api/files/root?sortBy=createdAt&direction=desc
     */
    @GetMapping("/root")
    public ResponseEntity<ApiResponse<List<FileResponse>>> getRootFiles(
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        String userId = getCurrentUserId();
        List<FileResponse> files = fileStorageService.getRootFiles(userId, sortBy, direction);
        return ResponseEntity.ok(ApiResponse.success(files));
    }

    /**
     * LẤY DANH SÁCH FILE (Hỗ trợ cả Root và Folder con)
     * GET /api/files/list?parentId=...
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<FileResponse>>> getFiles(
            @RequestParam(required = false) String parentId,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        String userId = getCurrentUserId();
        List<FileResponse> files = fileStorageService.getFilesByFolder(userId, parentId, sortBy, direction);
        return ResponseEntity.ok(ApiResponse.success(files));
    }

    /**
     * LẤY BREADCRUMBS CHO FOLDER
     * GET /api/files/breadcrumbs/{folderId}
     */
    @GetMapping("/breadcrumbs/{folderId}")
    public ResponseEntity<ApiResponse<List<FileResponse>>> getBreadcrumbs(@PathVariable String folderId) {
        List<FileResponse> breadcrumbs = fileStorageService.getBreadcrumbs(folderId);
        return ResponseEntity.ok(ApiResponse.success(breadcrumbs));
    }

    @GetMapping("/folders/all")
    public ResponseEntity<ApiResponse<List<FileResponse>>> getAllUserFolders() {
        String userId = getCurrentUserId();
        List<FileResponse> folders = fileStorageService.getAllUserFolders(userId);
        return ResponseEntity.ok(ApiResponse.success(folders));
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

    // AVATAR
    /**
     * API XEM/TẢI FILE TỪ GRIDFS
     * URL: /api/files/view/{id}
     * Dùng để hiển thị Avatar hoặc xem trước tài liệu
     */
    @GetMapping("/view/{id}")
    public ResponseEntity<InputStreamResource> viewFile(@PathVariable String id) throws IOException {
        // 1. Lấy thông tin file từ GridFS
        GridFSFile gridFSFile = fileStorageService.getFile(id);

        if (gridFSFile == null) {
            return ResponseEntity.notFound().build();
        }

        // 2. Tạo Resource để stream dữ liệu
        GridFsResource resource = gridFsTemplate.getResource(gridFSFile);

        // 3. Trả về ResponseEntity
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(gridFSFile.getMetadata().getString("contentType")))
                .body(new InputStreamResource(resource.getInputStream()));
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