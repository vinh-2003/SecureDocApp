package com.securedoc.backend.repository;

import com.securedoc.backend.entity.UserPageAccess;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPageAccessRepository extends MongoRepository<UserPageAccess, String> {

    /**
     * 1. CHECK QUYỀN (Quan trọng nhất)
     * Dùng để kiểm tra nhanh xem User có được xem trang này không.
     * Return true nếu tìm thấy bản ghi.
     */
    boolean existsByUserIdAndFileIdAndPageIndex(String userId, String fileId, int pageIndex);

    /**
     * 2. TÌM BẢN GHI CỤ THỂ
     * Dùng khi muốn lấy chi tiết hoặc để xoá (revoke) quyền.
     */
    Optional<UserPageAccess> findByUserIdAndFileIdAndPageIndex(String userId, String fileId, int pageIndex);

    /**
     * 3. LẤY DANH SÁCH CÁC TRANG ĐƯỢC CẤP QUYỀN TRONG 1 FILE
     * Dùng cho Frontend: Khi mở file, FE cần biết user được xem rõ những trang nào
     * để hiển thị icon ổ khoá mở/đóng cho đúng.
     */
    List<UserPageAccess> findByUserIdAndFileId(String userId, String fileId);

    /**
     * 4. GỠ QUYỀN (REVOKE)
     * Dùng khi chủ sở hữu muốn khoá lại trang đối với user này.
     */
    void deleteByUserIdAndFileIdAndPageIndex(String userId, String fileId, int pageIndex);

    /**
     * 5. DỌN DẸP DỮ LIỆU
     * Dùng khi xoá hoàn toàn File gốc -> Xoá hết các quyền liên quan.
     */
    void deleteByFileId(String fileId);

    // Đếm xem user này có bao nhiêu "vé" vào cửa cho file này
    long countByUserIdAndFileId(String userId, String fileId);

    // Lấy tất cả quyền của 1 file
    List<UserPageAccess> findByFileId(String fileId);

    // Lấy danh sách số trang (pageIndex) mà user được cấp quyền cho file này
    @Query(value = "{ 'userId': ?0, 'fileId': ?1 }", fields = "{ 'pageIndex': 1 }")
    List<UserPageAccess> findGrantedPagesByUserIdAndFileId(String userId, String fileId);
}