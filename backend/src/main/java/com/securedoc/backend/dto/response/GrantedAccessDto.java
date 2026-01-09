package com.securedoc.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrantedAccessDto {

    // ID của bản ghi trong bảng user_page_access (Dùng để xoá quyền nhanh)
    private String id;

    // --- Thông tin User (Để hiển thị Avatar/Tên) ---
    private String userId;
    private String userEmail;
    private String userFullName;
    private String userAvatar;

    // --- Thông tin Quyền hạn ---
    private String fileId;
    private int pageIndex; // Trang được cấp quyền xem rõ

    private long grantedAt; // Thời điểm cấp quyền (Timestamp)
}