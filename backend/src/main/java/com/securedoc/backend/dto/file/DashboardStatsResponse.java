package com.securedoc.backend.dto.file;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalFiles; // Tổng số lượng file
    private long totalSize;  // Tổng dung lượng (bytes)
}