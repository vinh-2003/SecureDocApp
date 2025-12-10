package com.securedoc.backend.repository;

import com.securedoc.backend.entity.FileNode;
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
}