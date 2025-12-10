package com.securedoc.backend.entity;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@Document(collection = "recent_files")
// Index kép: Tìm nhanh xem User X đã mở File Y chưa
@CompoundIndex(name = "user_file_idx", def = "{'userId': 1, 'fileId': 1}", unique = true)
public class RecentFile {
    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String fileId;

    private LocalDateTime accessedAt; // Thời gian xem gần nhất
}