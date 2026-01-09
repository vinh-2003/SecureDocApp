package com.securedoc.backend.service;

import com.securedoc.backend.entity.RecentFile;
import com.securedoc.backend.repository.RecentFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecentFileService {

    private final RecentFileRepository recentFileRepository;
    private final MongoTemplate mongoTemplate;

//    /**
//     * Ghi log truy cập (Chạy ẩn - Async để không làm chậm request tải file)
//     */
//    @Async
//    public void logAccess(String userId, String fileId) {
//        Optional<RecentFile> existing = recentFileRepository.findByUserIdAndFileId(userId, fileId);
//
//        if (existing.isPresent()) {
//            // Đã từng xem -> Update thời gian mới nhất
//            RecentFile recent = existing.get();
//            recent.setAccessedAt(LocalDateTime.now());
//            recentFileRepository.save(recent);
//        } else {
//            // Chưa xem bao giờ -> Tạo mới
//            RecentFile recent = RecentFile.builder()
//                    .userId(userId)
//                    .fileId(fileId)
//                    .accessedAt(LocalDateTime.now())
//                    .build();
//            recentFileRepository.save(recent);
//        }
//    }

    /**
     * Ghi log truy cập (Chạy ẩn - Async để không làm chậm request tải file)
     * - Nếu (userId, fileId) đã tồn tại → update thời gian accessedAt.
     * - Nếu chưa có → tự động insert mới.
     */
    @Async
    public void logAccess(String userId, String fileId) {
        Query query = new Query(Criteria.where("userId").is(userId).and("fileId").is(fileId));
        Update update = new Update()
                .set("userId", userId)
                .set("fileId", fileId)
                .set("accessedAt", LocalDateTime.now());

        // upsert = update nếu có, insert nếu chưa có
        mongoTemplate.upsert(query, update, RecentFile.class);
    }

    /**
     * Lấy danh sách ID các file đã xem (để đưa vào bộ lọc tìm kiếm)
     */
    public List<String> getRecentFileIds(String userId) {
        return recentFileRepository.findByUserId(userId).stream()
                .map(RecentFile::getFileId)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách RecentFile đầy đủ của User (để lấy thời gian accessedAt)
     */
    public List<RecentFile> getRecentFilesByUser(String userId) {
        return recentFileRepository.findByUserId(userId); // Giả sử repo đã có hàm này
    }
}