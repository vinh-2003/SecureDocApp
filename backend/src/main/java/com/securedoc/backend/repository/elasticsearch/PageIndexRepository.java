package com.securedoc.backend.repository.elasticsearch;

import com.securedoc.backend.entity.elasticsearch.PageIndex;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PageIndexRepository extends ElasticsearchRepository<PageIndex, String> {
    // Xoá tất cả trang của 1 file (Dùng khi xoá file gốc)
    void deleteAllByFileId(String fileId);

    // Tìm các trang của 1 file
    List<PageIndex> findByFileId(String fileId);
}