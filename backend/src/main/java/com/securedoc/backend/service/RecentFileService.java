package com.securedoc.backend.service;

import com.securedoc.backend.entity.RecentFile;
import com.securedoc.backend.repository.RecentFileRepository;
import lombok.RequiredArgsConstructor;
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

    /**
     * Ghi log truy cập (Chạy ẩn - Async để không làm chậm request tải file)
     */
    @Async
    public void logAccess(String userId, String fileId) {
        Optional<RecentFile> existing = recentFileRepository.findByUserIdAndFileId(userId, fileId);

        if (existing.isPresent()) {
            // Đã từng xem -> Update thời gian mới nhất
            RecentFile recent = existing.get();
            recent.setAccessedAt(LocalDateTime.now());
            recentFileRepository.save(recent);
        } else {
            // Chưa xem bao giờ -> Tạo mới
            RecentFile recent = RecentFile.builder()
                    .userId(userId)
                    .fileId(fileId)
                    .accessedAt(LocalDateTime.now())
                    .build();
            recentFileRepository.save(recent);
        }
    }

    /**
     * Lấy danh sách ID các file đã xem (để đưa vào bộ lọc tìm kiếm)
     */
    public List<String> getRecentFileIds(String userId) {
        return recentFileRepository.findByUserId(userId).stream()
                .map(RecentFile::getFileId)
                .collect(Collectors.toList());
    }
}