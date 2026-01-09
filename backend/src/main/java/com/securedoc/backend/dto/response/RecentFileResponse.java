// src/dto/response/RecentFileResponse.java
package com.securedoc.backend.dto.response;

import com.securedoc.backend.dto.file.FileResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentFileResponse {
    // Nhúng lại FileResponse cũ vào đây (hoặc copy các field cần thiết)
    private FileResponse file;

    // Thời điểm mở file
    private LocalDateTime accessedAt;
}