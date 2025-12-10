package com.securedoc.backend.repository.elasticsearch;

import com.securedoc.backend.entity.elasticsearch.DocumentIndex;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentIndexRepository extends ElasticsearchRepository<DocumentIndex, String> {

    // Spring Data Elasticsearch tự động generate query dựa trên tên hàm
    // Nhưng với logic phức tạp (filter permission), ta sẽ dùng ElasticsearchOperations trong Service
    // nên Repository này chủ yếu dùng để Save/Delete.

    // Ví dụ hàm tìm kiếm đơn giản (Admin dùng):
    // Tìm theo title hoặc content
    // List<DocumentIndex> findByTitleContainingOrContentContaining(String title, String content);
}