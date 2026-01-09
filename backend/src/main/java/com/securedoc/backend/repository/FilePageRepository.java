package com.securedoc.backend.repository;

import com.securedoc.backend.entity.FilePage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FilePageRepository extends MongoRepository<FilePage, String> {
    List<FilePage> findByFileIdOrderByPageIndexAsc(String fileId);
    void deleteByFileId(String fileId); // Dùng khi xoá file gốc

    // Đếm xem file này có bao nhiêu trang bị khoá
    long countByFileIdAndIsLockedTrue(String fileId);

    List<FilePage> findAllByFileId(String fileId);

    // Lấy danh sách số trang (pageIndex) đang bị khoá của file
    @Query(value = "{ 'fileId': ?0, 'isLocked': true }", fields = "{ 'pageIndex': 1 }")
    List<FilePage> findLockedPagesByFileId(String fileId);
}