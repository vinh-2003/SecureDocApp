package com.securedoc.backend.repository;

import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.enums.EFileType;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileNodeRepository extends MongoRepository<FileNode, String> {

    List<FileNode> findByParentIdAndIsDeletedFalse(String parentId);

    Optional<FileNode> findByIdAndIsDeletedFalse(String id);

    boolean existsByParentIdAndNameAndIsDeletedFalse(String parentId, String name);

    List<FileNode> findAllByAncestorsContaining(String folderId);

    // --- CẬP NHẬT QUERY BẢO MẬT (Dùng Enum) ---

    // Tìm file user được phép thấy (Owner OR Public != PRIVATE OR Shared)
    @Query("{ " +
            "'parentId': ?0, " +
            "'isDeleted': false, " +
            "$or: [ " +
            "{ 'ownerId': ?1 }, " +
            "{ 'publicAccess': { $ne: 'PRIVATE' } }, " + // ne = Not Equal
            "{ 'permissions': { $elemMatch: { 'userId': ?1 } } } " +
            "] " +
            "}")
    List<FileNode> findByParentIdAndUserAccess(String parentId, String userId);

    // Kiểm tra quyền truy cập 1 file cụ thể
    @Query("{ " +
            "'_id': ?0, " +
            "'isDeleted': false, " +
            "$or: [ " +
            "{ 'ownerId': ?1 }, " +
            "{ 'publicAccess': { $ne: 'PRIVATE' } }, " +
            "{ 'permissions': { $elemMatch: { 'userId': ?1 } } } " +
            "] " +
            "}")
    Optional<FileNode> findByIdAndUserAccess(String id, String userId);

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
    Optional<FileNode> findByParentIdAndNameAndTypeAndIsDeletedFalse(String parentId, String name, EFileType type);

    // Hàm kiểm tra trùng tên: Tìm node cùng cha, cùng tên, nhưng KHÁC ID
    boolean existsByParentIdAndNameAndIsDeletedFalseAndIdNot(String parentId, String name, String id);
}