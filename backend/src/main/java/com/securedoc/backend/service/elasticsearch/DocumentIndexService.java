package com.securedoc.backend.service.elasticsearch;

import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.entity.elasticsearch.DocumentIndex;
import com.securedoc.backend.repository.FileNodeRepository;
import com.securedoc.backend.repository.elasticsearch.DocumentIndexRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentIndexService {
    private final DocumentIndexRepository documentIndexRepository;
    private final FileNodeRepository fileNodeRepository;

    public void saveToElasticsearch(FileNode node) {
        saveToElasticsearch(node, null);
    }

    public void saveToElasticsearch(FileNode node, String content) {
        Set<String> allowed = calculateAllowedUsersFromHierarchy(node);

        DocumentIndex docIndex = DocumentIndex.builder()
                .id(node.getId())
                .name(node.getName()) // Map getName() vào name
                .description(node.getDescription())
                .content(content)
                .type(node.getType().name())
                .extension(node.getExtension())
                .mimeType(node.getMimeType()) // Lưu mimeType
                .size(node.getSize())         // Lưu size
                .status(node.getStatus().name())
                .isDeleted(node.isDeleted())
                .ownerId(node.getOwnerId())
                .allowedUsers(new ArrayList<>(allowed))
                .ancestors(node.getAncestors())
                // Convert LocalDateTime sang String ISO-8601
                .createdAt(node.getCreatedAt() != null ? node.getCreatedAt().toString() : null)
                .updatedAt(node.getUpdatedAt() != null ? node.getUpdatedAt().toString() : null)
                .build();

        documentIndexRepository.save(docIndex);
    }

    /**
     * Helper: Chỉ cập nhật các trường thay đổi lên ES
     * Để tránh làm mất 'content' (nội dung file) đã được index trước đó.
     */
    public void updateElasticsearchAfterRename(FileNode node) {
        try {
            // 1. Tìm document cũ trong ES
            DocumentIndex existingDoc = documentIndexRepository.findById(node.getId()).orElse(null);

            if (existingDoc != null) {
                // 2. Chỉ cập nhật Metadata (Giữ nguyên field 'content')
                existingDoc.setName(node.getName());
                existingDoc.setExtension(node.getExtension());
                existingDoc.setUpdatedAt(node.getUpdatedAt() != null ? node.getUpdatedAt().toString() : null);

                // Lưu đè lại (Spring Data ES sẽ update document này)
                documentIndexRepository.save(existingDoc);
            } else {
                // 3. Trường hợp hiếm: File có trong DB nhưng chưa có trong ES
                // Lúc này đành phải tạo mới (Content sẽ null, chấp nhận được vì còn hơn không có)
                saveToElasticsearch(node);
            }
        } catch (Exception e) {
            // Log lỗi nhưng không chặn luồng chính
            System.err.println("Lỗi đồng bộ Elasticsearch khi Rename: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Helper: Chỉ cập nhật trường description lên ES
     */
    public void updateElasticsearchDescription(FileNode node) {
        try {
            DocumentIndex existingDoc = documentIndexRepository.findById(node.getId()).orElse(null);

            if (existingDoc != null) {
                // Chỉ update trường description và thời gian update
                existingDoc.setDescription(node.getDescription());
                existingDoc.setUpdatedAt(node.getUpdatedAt() != null ? node.getUpdatedAt().toString() : null);

                documentIndexRepository.save(existingDoc);
            } else {
                // Nếu chưa có doc thì tạo mới (chấp nhận mất content nếu là file)
                saveToElasticsearch(node);
            }
        } catch (Exception e) {
            System.err.println("Lỗi đồng bộ ES (Description): " + e.getMessage());
        }
    }

    // Hàm update ES Metadata (để code move gọi)
    public void updateElasticsearchMetadata(FileNode node) {
        try {
            var docOpt = documentIndexRepository.findById(node.getId());
            if (docOpt.isPresent()) {
                var doc = docOpt.get();
                doc.setName(node.getName());
                doc.setAncestors(node.getAncestors());
                doc.setUpdatedAt(node.getUpdatedAt() != null ? node.getUpdatedAt().toString() : null);

                // Update Allowed Users cho tìm kiếm
                Set<String> allowed = calculateAllowedUsersFromHierarchy(node);
                doc.setAllowedUsers(new ArrayList<>(allowed));

                documentIndexRepository.save(doc);
            }
        } catch (Exception e) {
            System.err.println("ES Sync Error: " + e.getMessage());
        }
    }

    /**
     * Sync trạng thái deleted sang Elasticsearch
     */
    public void updateElasticsearchDeleteStatus(FileNode node) {
        try {
            var docOpt = documentIndexRepository.findById(node.getId());
            if (docOpt.isPresent()) {
                var doc = docOpt.get();
                doc.setDeleted(node.isDeleted());
                // Không update ancestors để giữ khả năng search vị trí cũ
                documentIndexRepository.save(doc);
            }
        } catch (Exception e) {
            System.err.println("ES Sync Error: " + e.getMessage());
        }
    }

    /**
     * Sync trạng thái deleted sang Elasticsearch
     */
    public void updateElasticsearchDeleteAndShareStatus(FileNode node) {
        try {
            var docOpt = documentIndexRepository.findById(node.getId());
            if (docOpt.isPresent()) {
                var doc = docOpt.get();

                Set<String> allowed = calculateAllowedUsersFromHierarchy(node);
                doc.setAllowedUsers(new ArrayList<>(allowed));

                doc.setDeleted(node.isDeleted());
                doc.setAncestors(node.getAncestors());
                documentIndexRepository.save(doc);
            }
        } catch (Exception e) {
            System.err.println("ES Sync Error: " + e.getMessage());
        }
    }

    /**
     * Sync trạng thái sang Elasticsearch
     */
    public void updateElasticsearchStatus(FileNode node) {
        try {
            DocumentIndex existingDoc = documentIndexRepository.findById(node.getId()).orElse(null);

            if (existingDoc != null) {
                // Chỉ update trường status và thời gian update
                existingDoc.setStatus(node.getStatus().name());
                existingDoc.setUpdatedAt(node.getUpdatedAt() != null ? node.getUpdatedAt().toString() : null);

                documentIndexRepository.save(existingDoc);
            } else {
                // Nếu chưa có doc thì tạo mới (chấp nhận mất content nếu là file)
                saveToElasticsearch(node);
            }
        } catch (Exception e) {
            System.err.println("Lỗi đồng bộ ES (Description): " + e.getMessage());
        }
    }

    /**
     * Cập nhật các trường metadata của FileNode lên Elasticsearch
     * KHÔNG làm ảnh hưởng đến trường content đã được index
     */
    public void updateElasticsearchMetadataOnly(FileNode node) {
        try {
            // 1. Tìm document hiện có trong Elasticsearch
            DocumentIndex existingDoc = documentIndexRepository.findById(node.getId()).orElse(null);

            if (existingDoc != null) {
                // 2. Chỉ cập nhật các trường metadata, giữ nguyên content
                existingDoc.setName(node.getName());
                existingDoc.setDescription(node.getDescription());
                existingDoc.setType(node.getType().name());
                existingDoc.setExtension(node.getExtension());
                existingDoc.setMimeType(node.getMimeType());
                existingDoc.setSize(node.getSize());
                existingDoc.setStatus(node.getStatus().name());
                existingDoc.setDeleted(node.isDeleted());
                existingDoc.setOwnerId(node.getOwnerId());
                existingDoc.setAncestors(node.getAncestors());

                // 3. Tính toán lại allowed users từ hệ thống phân cấp
                Set<String> allowedUsers = calculateAllowedUsersFromHierarchy(node);
                existingDoc.setAllowedUsers(new ArrayList<>(allowedUsers));

                // 4. Cập nhật timestamps
                if (node.getCreatedAt() != null) {
                    existingDoc.setCreatedAt(node.getCreatedAt().toString());
                }
                if (node.getUpdatedAt() != null) {
                    existingDoc.setUpdatedAt(node.getUpdatedAt().toString());
                }

                // 5. Lưu document (chỉ cập nhật các trường đã thay đổi, giữ nguyên content)
                documentIndexRepository.save(existingDoc);

                log.debug("Updated Elasticsearch metadata for node: {}", node.getId());
            } else {
                // 6. Nếu document chưa tồn tại, tạo mới hoàn toàn (content sẽ là null)
                saveToElasticsearch(node);
                log.warn("Document not found in Elasticsearch, created new document for node: {}", node.getId());
            }
        } catch (Exception e) {
            log.error("Error updating Elasticsearch metadata for node {}: {}", node.getId(), e.getMessage(), e);
            // Không throw exception để không ảnh hưởng đến luồng chính
        }
    }

    // Đồng bộ 1 node sang Elastic (Để dùng trong vòng lặp đệ quy)
    public void syncOneNodeToElastic(FileNode node) {
        DocumentIndex doc = documentIndexRepository.findById(node.getId()).orElse(null);
        if (doc != null) {
            // Tính toán allowedUsers từ tổ tiên (bao gồm cả "Thái thượng hoàng")
            Set<String> allowedUsers = calculateAllowedUsersFromHierarchy(node);

            doc.setAllowedUsers(new ArrayList<>(allowedUsers));
            documentIndexRepository.save(doc);
        }
    }

    public void updateContentAndVectors(String id, String content, float[] imageVector) {
        documentIndexRepository.findById(id).ifPresent(doc -> {
            boolean changed = false;

            // 1. Cập nhật Content (Text)
            // Lưu ý: Whisper transcript hoặc OCR text đều được truyền vào đây để search full-text
            if (content != null) {
                doc.setContent(content);
                changed = true;
            }

            // 2. Cập nhật Image Vector (Chỉ dành cho ảnh)
            // Kiểm tra != null và độ dài > 0 để tránh lưu mảng rỗng
            if (imageVector != null && imageVector.length > 0) {
                doc.setImageVector(imageVector);
                changed = true;
            }

            // 3. Luôn cập nhật trạng thái thành AVAILABLE khi xử lý xong
            // Để đảm bảo file tìm thấy được trên giao diện
            if (!"AVAILABLE".equals(doc.getStatus())) {
                doc.setStatus("AVAILABLE");
                changed = true;
            }

            if (changed) {
                // Cập nhật thời gian sửa đổi (Optional: dùng thư viện Time của bạn)
                doc.setUpdatedAt(java.time.LocalDateTime.now().toString());
                documentIndexRepository.save(doc);
            }
        });
    }

    /**
     * Tính toán allowedUsers từ hệ thống phân cấp (bao gồm "Thái thượng hoàng")
     */
    private Set<String> calculateAllowedUsersFromHierarchy(FileNode node) {
        Set<String> allowed = new HashSet<>();

        // 1. Owner của node hiện tại
        allowed.add(node.getOwnerId());

        // 2. Users trong permissions (chỉ người ngoài - không có "Thái thượng hoàng")
        node.getPermissions().forEach(p -> allowed.add(p.getUserId()));

        // 3. [QUAN TRỌNG] Thêm tất cả "Thái thượng hoàng" từ ancestors
        if (node.getAncestors() != null && !node.getAncestors().isEmpty()) {
            List<FileNode> ancestors = fileNodeRepository.findAllById(node.getAncestors());

            // 3.1. Thêm owner của từng ancestor
            ancestors.forEach(ancestor -> allowed.add(ancestor.getOwnerId()));
        }

        return allowed;
    }
}