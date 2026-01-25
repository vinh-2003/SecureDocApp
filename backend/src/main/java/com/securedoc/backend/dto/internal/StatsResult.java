package com.securedoc.backend.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatsResult {
    private String id;   // Giá trị gom nhóm (VD: "AVAILABLE", "application/pdf")
    private long count;  // Số lượng
    private long totalSize; // Tổng dung lượng (nếu cần)
}