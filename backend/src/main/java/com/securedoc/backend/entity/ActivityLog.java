package com.securedoc.backend.entity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import com.securedoc.backend.enums.EActivityType;
import com.securedoc.backend.enums.EFileType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "activity_logs")
@CompoundIndexes({
    // Index chính:  Query theo folder cha (bao gồm con cháu)
    @CompoundIndex(name = "idx_ancestor_time", def = "{'ancestorIds': 1, 'createdAt': -1}"),

    // Index phụ: Query theo node cụ thể
    @CompoundIndex(name = "idx_target_time", def = "{'targetNodeId': 1, 'createdAt': -1}"),

    // Index phụ: Query theo actor (My Activity)
    @CompoundIndex(name = "idx_actor_time", def = "{'actorId': 1, 'createdAt': -1}"), // Index cho TTL (tự động xóa log cũ sau 1 năm - tuỳ chọn)
// @CompoundIndex(name = "idx_ttl", def = "{'createdAt': 1}", expireAfterSeconds = 31536000)
})
public class ActivityLog {

    @Id
    private String id;

    // === THÔNG TIN HÀNH ĐỘNG ===
    private EActivityType actionType;

    // === THÔNG TIN FILE/FOLDER BỊ TÁC ĐỘNG ===
    private String targetNodeId;
    private String targetNodeName;      // Denormalize để hiển thị nhanh
    private EFileType targetNodeType;   // FILE hoặc FOLDER
    private String targetNodeOwnerId;   // Owner của file (để check quyền)

    // === ĐƯỜNG DẪN TỔ TIÊN (Quan trọng!) ===
    // Copy từ FileNode. ancestors + targetNodeId
    // Dùng để query "lịch sử trong folder X"
    @Builder.Default
    private List<String> ancestorIds = List.of();

    // === THÔNG TIN NGƯỜI THỰC HIỆN ===
    private String actorId;
    private String actorName;           // Denormalize
    private String actorEmail;          // Denormalize
    private String actorAvatarUrl;      // Denormalize

    // === CHI TIẾT BỔ SUNG (Tuỳ loại action) ===
    // Ví dụ:
    // - RENAMED: {oldName: "abc. pdf", newName: "xyz.pdf"}
    // - MOVED: {fromParentId: ".. .", toParentId: ".. .", fromPath: "A/B", toPath: "C/D"}
    // - SHARED: {targetUserId: "...", targetUserEmail: "...", role: "EDITOR"}
    private Map<String, Object> details;

    // === THỜI GIAN ===
    @CreatedDate
    private LocalDateTime createdAt;

    // === HELPER:  Tạo danh sách ancestorIds từ FileNode ===
    public static List<String> buildAncestorIds(FileNode node) {
        List<String> ancestors = new java.util.ArrayList<>(
                node.getAncestors() != null ? node.getAncestors() : List.of()
        );
        ancestors.add(node.getId());
        return ancestors;
    }
}
