package com.securedoc.backend.repository;

import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.enums.EFileStatus;
import com.securedoc.backend.enums.EFileType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import com.securedoc.backend.dto.internal.StatsResult;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FileNodeRepository extends MongoRepository<FileNode, String> {

    List<FileNode> findByParentIdAndIsDeletedFalse(String parentId);

    Optional<FileNode> findByIdAndIsDeletedFalse(String id);

    boolean existsByParentIdAndNameAndOwnerIdAndIsDeletedFalse(String parentId, String name, String ownerId);

    List<FileNode> findAllByAncestorsContaining(String folderId);

    // --- CẬP NHẬT QUERY BẢO MẬT (Dùng Enum) ---

    // 1. Dùng cho "Lãnh chúa" (Lấy tất cả, không cần check quyền từng file)
    List<FileNode> findAllByParentIdAndIsDeletedFalse(String parentId, Sort sort);

    // 2. Dùng cho "Khách" (Lọc kỹ: Chính chủ OR Public OR Được share)
    @Query("{ " +
            "'parentId': ?0, " +
            "'isDeleted': false, " +
            "$or: [ " +
            "{ 'ownerId': ?1 }, " + // File của chính Guest tạo trong folder này
            "{ 'publicAccess': { $ne: 'PRIVATE' } }, " + // File công khai
            "{ 'permissions': { $elemMatch: { 'userId': ?1 } } } " + // File được share riêng
            "] " +
            "}")
    List<FileNode> findByParentIdAndUserAccess(String parentId, String userId, Sort sort);

//    // Kiểm tra quyền truy cập 1 file cụ thể
//    @Query("{ " +
//            "'_id': ?0, " +
//            "'isDeleted': false, " +
//            "$or: [ " +
//            "{ 'ownerId': ?1 }, " +
//            "{ 'publicAccess': { $ne: 'PRIVATE' } }, " +
//            "{ 'permissions': { $elemMatch: { 'userId': ?1 } } } " +
//            "] " +
//            "}")
//    Optional<FileNode> findByIdAndUserAccess(String id, String userId);

    // ==========================================
    // --- THÊM MỚI CHO DASHBOARD ---
    // ==========================================

    // 1. Đếm tổng số file (Type=FILE) của user (không tính Folder, không tính file xóa)
    long countByOwnerIdAndTypeAndIsDeletedFalse(String ownerId, EFileType type);

    // 2. Tính tổng dung lượng bằng Aggregation (Hiệu năng cao)
    @Aggregation(pipeline = {
            "{ '$match': { 'ownerId': ?0, 'type': 'FILE', 'isDeleted': false } }",
            "{ '$group': { '_id': null, 'totalSize': { '$sum': '$size' } } }"
    })
    Long getTotalSizeByOwnerId(String ownerId);

    // 3. Lấy danh sách Root (ParentId = null) của User, có Sort
    List<FileNode> findByOwnerIdAndParentIdIsNullAndIsDeletedFalse(String ownerId, Sort sort);

    // Tìm các node nằm trong danh sách ID (Dùng để lấy thông tin ancestors)
    // Sắp xếp theo ancestors.size để đảm bảo thứ tự từ Gốc -> Ngọn
    List<FileNode> findAllByIdIn(List<String> ids);

    // Lấy tất cả thư mục (Type=FOLDER) của user để vẽ cây (chỉ cần id, name, parentId)
    @Query(value = "{ 'ownerId': ?0, 'type': 'FOLDER', 'isDeleted': false }", fields = "{ 'id': 1, 'name': 1, 'parentId': 1 }")
    List<FileNode> findAllFoldersByOwnerId(String ownerId);

    // Tìm folder theo parent và tên (để check trùng khi upload folder)
    Optional<FileNode> findByParentIdAndNameAndTypeAndOwnerIdAndIsDeletedFalse(String parentId, String name, EFileType type, String ownerId);

    // Hàm kiểm tra trùng tên: Tìm node cùng cha, cùng tên, nhưng KHÁC ID
    boolean existsByParentIdAndNameAndIsDeletedFalseAndIdNot(String parentId, String name, String id);

    // Tìm tất cả các node là con cháu của folderId (dựa trên ancestors chứa folderId)
    List<FileNode> findAllByAncestorsContainingAndIsDeletedFalse(String ancestorId);

    // Kiểm tra tồn tại (Dùng khi Khôi phục để check folder cha cũ còn sống không)
    boolean existsByIdAndIsDeletedFalse(String id);

    // Tìm file trong thùng rác ở cấp Root (để hiển thị danh sách thùng rác ban đầu)
    // parentId = null nghĩa là file này đã bị cắt khỏi cha cũ
    List<FileNode> findByOwnerIdAndIsDeletedTrueAndParentIdIsNull(String ownerId, Sort sort);

    // Tìm file trong thùng rác ở cấp Con (để hiển thị khi click vào folder trong thùng rác)
    List<FileNode> findByParentIdAndIsDeletedTrue(String parentId);

    @Query("{ 'permissions': { $elemMatch: { 'userId': ?0 } }, 'ownerId': { $ne: ?0 }, 'isDeleted': false }")
    List<FileNode> findAllSharedWithUser(String userId);

    List<FileNode> findByStatusAndCreatedAtBefore(EFileStatus status, LocalDateTime date);

    // [MỚI] Lấy danh sách ID các thư mục nằm ngay tại Root của User (để dùng cho query ancestors)
    @Query(value = "{ 'ownerId': ?0, 'parentId': null, 'type': 'FOLDER', 'isDeleted': false }", fields = "{ '_id': 1 }")
    List<FileNode> findRootFolderIdsByOwnerId(String userId);

    /**
     * Tìm các Node GỐC trong thùng rác đã quá hạn
     * Điều kiện:
     * 1. isDeleted = true
     * 2. parentId = null (Chỉ lấy root của thùng rác để tránh trùng lặp đệ quy)
     * 3. trashedAt < thresholdTime
     */
    List<FileNode> findByIsDeletedTrueAndParentIdIsNullAndTrashedAtBefore(LocalDateTime thresholdTime);

    // ==========================================
    // --- ADMIN DASHBOARD STATS (Aggregation) ---
    // ==========================================

    // 1. Tính tổng dung lượng toàn hệ thống (Active Files)
    @Aggregation(pipeline = {
            "{ '$match': { 'type': 'FILE', 'isDeleted': false } }",
            "{ '$group': { '_id': null, 'totalSize': { '$sum': '$size' } } }"
    })
    Long getSystemTotalSize();

    // 2. Thống kê theo Trạng thái (AVAILABLE, FAILED...)
    @Aggregation(pipeline = {
            "{ '$match': { 'type': 'FILE', 'isDeleted': false } }",
            "{ '$group': { '_id': '$status', 'count': { '$sum': 1 } } }"
    })
    List<StatsResult> getSystemStatusStats();

    // 3. Thống kê theo Loại file (Top 5 MimeType phổ biến nhất)
    @Aggregation(pipeline = {
            "{ '$match': { 'type': 'FILE', 'isDeleted': false } }",
            "{ '$group': { '_id': '$mimeType', 'count': { '$sum': 1 } } }",
            "{ '$sort': { 'count': -1 } }",
            "{ '$limit': 5 }"
    })
    List<StatsResult> getSystemMimeTypeStats();

    // 4. Thống kê Thùng rác (Số lượng + Dung lượng)
    @Aggregation(pipeline = {
            "{ '$match': { 'type': 'FILE', 'isDeleted': true } }",
            "{ '$group': { '_id': null, 'count': { '$sum': 1 }, 'totalSize': { '$sum': '$size' } } }"
    })
    StatsResult getSystemTrashStats();

    // 5. Đếm số lượng thư mục
    long countByTypeAndIsDeletedFalse(EFileType type);

    Page<FileNode> findByStatusAndTypeAndIsDeletedFalse(EFileStatus status, EFileType type, Pageable pageable);
}