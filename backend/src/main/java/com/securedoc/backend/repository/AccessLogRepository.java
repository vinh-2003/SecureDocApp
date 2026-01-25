package com.securedoc.backend.repository;

import com.securedoc.backend.entity.AccessLog;
import com.securedoc.backend.enums.EAccessAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AccessLogRepository extends MongoRepository<AccessLog, String> {

    // 1. Tìm kiếm khi CÓ keyword VÀ CÓ action cụ thể
    @Query("{ " +
            "'$and': [ " +
            "{ '$or': [ " +
            "{ 'username': { $regex: ?0, $options: 'i' } }, " +
            "{ 'ipAddress': { $regex: ?0, $options: 'i' } } " +
            "] }, " +
            "{ 'action': ?1 } " +
            "] " +
            "}")
    Page<AccessLog> searchLogsWithAction(String keyword, EAccessAction action, Pageable pageable);

    // 2. Tìm kiếm khi CHỈ CÓ keyword (Action = null)
    @Query("{ '$or': [ " +
            "{ 'username': { $regex: ?0, $options: 'i' } }, " +
            "{ 'ipAddress': { $regex: ?0, $options: 'i' } } " +
            "] }")
    Page<AccessLog> searchLogs(String keyword, Pageable pageable);

    // 3. Tìm kiếm khi CHỈ CÓ action (Keyword = null/empty)
    Page<AccessLog> findByAction(EAccessAction action, Pageable pageable);
}