package com.securedoc.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.securedoc.backend.entity.ActivityLog;
import com.securedoc.backend.enums.EActivityType;

@Repository
public interface ActivityLogRepository extends MongoRepository<ActivityLog, String> {

    // ===================================================================
    // 1. QUERY THEO NODE (Bao gồm con cháu nếu là Folder)
    // ===================================================================
    /**
     * Lấy activity của m��t folder VÀ tất cả con cháu bên trong. Sử dụng index:
     * idx_ancestor_time
     */
    Page<ActivityLog> findByAncestorIdsContainingOrderByCreatedAtDesc(
            String nodeId,
            Pageable pageable
    );

    /**
     * Lấy activity của đúng 1 node (không bao gồm con cháu). Sử dụng index:
     * idx_target_time
     */
    Page<ActivityLog> findByTargetNodeIdOrderByCreatedAtDesc(
            String nodeId,
            Pageable pageable
    );

    // ===================================================================
    // 2. QUERY THEO ACTOR (My Activity)
    // ===================================================================
    /**
     * Lấy tất cả activity do một user thực hiện. Sử dụng index: idx_actor_time
     */
    Page<ActivityLog> findByActorIdOrderByCreatedAtDesc(
            String actorId,
            Pageable pageable
    );

    // ===================================================================
    // 3. QUERY NÂNG CAO (Có filter)
    // ===================================================================
    /**
     * Lấy activity trong folder với filter theo loại hành động.
     */
    @Query("{ 'ancestorIds': ?0, 'actionType': { $in: ?1 } }")
    Page<ActivityLog> findByAncestorAndActionTypes(
            String nodeId,
            List<EActivityType> actionTypes,
            Pageable pageable
    );

    /**
     * Lấy activity trong khoảng thời gian.
     */
    @Query("{ 'ancestorIds': ?0, 'createdAt':  { $gte: ?1, $lte: ?2 } }")
    Page<ActivityLog> findByAncestorAndTimeRange(
            String nodeId,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable
    );

    /**
     * Lấy activity với đầy đủ filter.
     */
    @Query("{ "
            + "$and: [ "
            + "  { 'ancestorIds': ?0 }, "
            + "  { $or: [ { $expr: { $eq: [?1, null] } }, { 'actionType': { $in: ?1 } } ] }, "
            + "  { $or: [ { $expr: { $eq: [?2, null] } }, { 'actorId': ?2 } ] }, "
            + "  { $or: [ { $expr: { $eq:  [?3, null] } }, { 'createdAt': { $gte:  ?3 } } ] }, "
            + "  { $or: [ { $expr: { $eq: [?4, null] } }, { 'createdAt': { $lte: ?4 } } ] } "
            + "] "
            + "}")
    Page<ActivityLog> findWithFilters(
            String nodeId,
            List<EActivityType> actionTypes,
            String actorId,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable
    );

    // ===================================================================
    // 4. QUERY HỖ TRỢ (Cleanup, Statistics)
    // ===================================================================
    /**
     * Đếm số activity trong một folder.
     */
    long countByAncestorIdsContaining(String nodeId);

    /**
     * Xóa activity của một node (khi xóa vĩnh viễn).
     */
    void deleteAllByTargetNodeId(String nodeId);

    /**
     * Xóa activity cũ hơn một ngày nhất định (Cleanup job).
     */
    void deleteByCreatedAtBefore(LocalDateTime threshold);

    /**
     * Lấy activity gần nhất của một node (để hiển thị "Last modified").
     */
    @Query(value = "{ 'targetNodeId': ?0 }", sort = "{ 'createdAt': -1 }")
    List<ActivityLog> findLatestByTargetNodeId(String nodeId, Pageable pageable);
}
