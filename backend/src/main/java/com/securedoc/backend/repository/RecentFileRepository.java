package com.securedoc.backend.repository;

import com.securedoc.backend.entity.RecentFile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecentFileRepository extends MongoRepository<RecentFile, String> {

    // Tìm để update thời gian
    Optional<RecentFile> findByUserIdAndFileId(String userId, String fileId);

    // Lấy danh sách để phục vụ Search
    List<RecentFile> findByUserId(String userId);

    // Lấy danh sách, hỗ trợ phân trang (để giới hạn ví dụ lấy 20 file gần nhất)
    List<RecentFile> findAllByUserIdOrderByAccessedAtDesc(String userId, Pageable pageable);

    void deleteByFileId(String fileId);
}