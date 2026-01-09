package com.securedoc.backend.dto.page;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FilePageResponse {
    private String id;        // ID của FilePage (không phải GridFS ID)
    private int pageIndex;    // Số trang (0, 1, 2...)
    private int width;        // Kích thước ảnh
    private int height;

    private boolean isLocked;    // Trạng thái khoá
    private boolean canViewClear; // User hiện tại có được xem rõ không? (Để FE hiện icon khoá mở/đóng)

    // URL để FE gọi lấy ảnh (VD: /api/pages/{pageId}/image)
    private String imageUrl;
}