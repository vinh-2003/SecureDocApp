package com.securedoc.backend.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class AdminDocStatsResponse {
    // --- Tổng quan ---
    private long totalFiles;       // Tổng số file (Active)
    private long totalFolders;     // Tổng số thư mục
    private long totalSize;        // Tổng dung lượng đang chiếm dụng (bytes)

    // --- Thùng rác ---
    private long trashFiles;       // Số file trong thùng rác
    private long trashSize;        // Dung lượng rác

    // --- Phân bố trạng thái (Health Check) ---
    // VD: { "AVAILABLE": 1000, "PROCESSING": 5, "FAILED": 2 }
    private Map<String, Long> statusDistribution;

    // --- Phân bố loại file (Top 5) ---
    // VD: { "application/pdf": 500, "image/png": 200 }
    private Map<String, Long> mimeTypeDistribution;
}