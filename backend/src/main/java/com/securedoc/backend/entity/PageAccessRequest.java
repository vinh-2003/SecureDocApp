package com.securedoc.backend.entity;

import com.securedoc.backend.enums.ERequestStatus; // Tạo Enum: PENDING, APPROVED, REJECTED
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@Document(collection = "page_access_requests")
public class PageAccessRequest {
    @Id
    private String id;

    @Indexed
    private String fileId;

    @Indexed
    private String ownerId;     // Lưu ownerId để query cho nhanh (Owner xem danh sách request đến)

    @Indexed
    private String requesterId; // Người xin quyền

    private List<Integer> pageIndexes; // Danh sách các trang muốn mở (VD: [0, 5, 10])

    private String reason;      // Lý do xin mở (VD: "Em cần tham khảo cho đồ án")

    private ERequestStatus status; // PENDING, APPROVED, REJECTED

    @CreatedDate
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}