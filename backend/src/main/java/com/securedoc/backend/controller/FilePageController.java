package com.securedoc.backend.controller;

import com.securedoc.backend.dto.response.GrantedAccessDto;
import com.securedoc.backend.payload.response.ApiResponse;
import com.securedoc.backend.dto.page.FilePageResponse;
import com.securedoc.backend.security.services.UserDetailsImpl;
import com.securedoc.backend.service.FilePageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FilePageController {

    private final FilePageService filePageService;

    // 1. Lấy danh sách trang của file
    @GetMapping("/files/{fileId}/pages")
    public ResponseEntity<ApiResponse<List<FilePageResponse>>> getPages(@PathVariable String fileId) {
        String userId = getCurrentUserId(); // Hàm lấy từ SecurityContext
        List<FilePageResponse> pages = filePageService.getPages(fileId, userId);
        return ResponseEntity.ok(ApiResponse.success(pages));
    }

    // 2. Hiển thị ảnh trang (Stream trực tiếp)
    // URL: /api/pages/{pageId}/image
    @GetMapping("/pages/{pageId}/image")
    public ResponseEntity<InputStreamResource> getPageImage(@PathVariable String pageId) {
        try {
            String userId = getCurrentUserId();
            InputStream imageStream = filePageService.getPageImageStream(pageId, userId);

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG) // Luôn trả về JPG (do lúc save ta đã convert)
                    .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .header(HttpHeaders.EXPIRES, "0")
                    .body(new InputStreamResource(imageStream));

        } catch (Exception e) {
            // Nếu lỗi trả về 404 hoặc ảnh mặc định lỗi
            return ResponseEntity.notFound().build();
        }
    }

    // 3. Khoá/Mở trang (Owner only)
    @PutMapping("/pages/{pageId}/lock")
    public ResponseEntity<ApiResponse<Boolean>> toggleLock(@PathVariable String pageId) {
        String userId = getCurrentUserId();
        boolean isLocked = filePageService.togglePageLock(pageId, userId);
        return ResponseEntity.ok(ApiResponse.success(isLocked, "Đã thay đổi trạng thái khoá"));
    }

    @GetMapping("/files/{fileId}/access")
    public ResponseEntity<ApiResponse<List<GrantedAccessDto>>> getGrantedAccess(@PathVariable String fileId) {
        // Check owner nếu cần
        return ResponseEntity.ok(ApiResponse.success(filePageService.getGrantedAccessList(fileId)));
    }

    @DeleteMapping("/files/{fileId}/access")
    public ResponseEntity<ApiResponse<String>> revokeAccess(
            @PathVariable String fileId,
            @RequestParam String userId,
            @RequestParam int pageIndex
    ) {
        // Check owner
        filePageService.revokeAccess(userId, fileId, pageIndex);
        return ResponseEntity.ok(ApiResponse.success("Đã thu hồi quyền truy cập."));
    }

    // Helper lấy userId (Giả định bạn có BaseController)
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        throw new RuntimeException("Unauthorized: Không tìm thấy thông tin người dùng");
    }
}