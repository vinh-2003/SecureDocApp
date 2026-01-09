package com.securedoc.backend.repository;

import com.securedoc.backend.entity.PageAccessRequest;
import com.securedoc.backend.enums.ERequestStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PageAccessRequestRepository extends MongoRepository<PageAccessRequest, String> {

    /**
     * 1. LẤY DANH SÁCH YÊU CẦU ĐẾN (Cho Chủ sở hữu)
     * Thường dùng để hiển thị trên Dashboard của Owner.
     * Sắp xếp: Mới nhất lên đầu.
     */
    List<PageAccessRequest> findByOwnerIdAndStatusOrderByCreatedAtDesc(String ownerId, ERequestStatus status);

    /**
     * 2. LẤY DANH SÁCH YÊU CẦU ĐÃ GỬI (Cho Người đi xin)
     * Để người dùng xem lại lịch sử xin quyền của mình.
     */
    List<PageAccessRequest> findByRequesterIdOrderByCreatedAtDesc(String requesterId);

    /**
     * 3. CHECK SPAM (Tùy chọn)
     * Kiểm tra xem User này đã có request nào đang PENDING cho file này chưa.
     * Nếu có rồi thì không cho gửi thêm để tránh spam.
     */
    boolean existsByRequesterIdAndFileIdAndStatus(String requesterId, String fileId, ERequestStatus status);

    void deleteByFileId(String fileId);
}