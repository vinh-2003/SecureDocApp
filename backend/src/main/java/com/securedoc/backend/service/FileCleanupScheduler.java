package com.securedoc.backend.service;

import com.securedoc.backend.dto.file.FileIdListRequest;
import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.enums.EFileStatus;
import com.securedoc.backend.repository.FileNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileCleanupScheduler {

    private final FileNodeRepository fileNodeRepository;
    private final FileStorageService fileStorageService;

    @Value("${app.trash.retention-days:30}")
    private int trashRetentionDays;

    /**
     * Chạy định kỳ mỗi 15 phút (900.000 ms)
     * Tìm các file đang PROCESSING quá 30 phút -> Chuyển thành FAILED
     */
    @Scheduled(fixedRate = 900000)
    public void markZombieTasksAsFailed() {
        log.info("--- Bắt đầu quét Zombie Tasks ---");

        // Thời điểm giới hạn: 30 phút trước
        LocalDateTime thresholdTime = LocalDateTime.now().minusMinutes(30);

        // Tìm các file PROCESSING cũ hơn 30 phút
        // Bạn cần viết thêm method này trong Repository hoặc dùng Query Template
        // Ở đây dùng cú pháp giả định findByStatusAndCreatedAtBefore
        List<FileNode> zombies = fileNodeRepository.findByStatusAndCreatedAtBefore(
                EFileStatus.PROCESSING,
                thresholdTime
        );

        if (!zombies.isEmpty()) {
            log.warn("Phát hiện {} file bị treo (Zombie). Đang chuyển sang FAILED...", zombies.size());

            for (FileNode node : zombies) {
                node.setStatus(EFileStatus.FAILED);
            }

            fileNodeRepository.saveAll(zombies);
        }

        log.info("--- Kết thúc quét Zombie Tasks ---");
    }

    /**
     * Job 2: Dọn dẹp thùng rác tự động (Auto Empty Trash)
     * Chạy mỗi ngày một lần vào lúc 2:00 sáng
     * Cron: Giây Phút Giờ Ngày Tháng Thứ
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupTrashBin() {
        log.info("--- Bắt đầu dọn dẹp Thùng Rác (Retention: {} ngày) ---", trashRetentionDays);

        LocalDateTime thresholdTime = LocalDateTime.now().minusDays(trashRetentionDays);

        // 1. Lấy danh sách Root nodes trong thùng rác đã hết hạn
        List<FileNode> expiredNodes = fileNodeRepository.findByIsDeletedTrueAndParentIdIsNullAndTrashedAtBefore(thresholdTime);

        if (expiredNodes.isEmpty()) {
            log.info("Không có file nào cần xoá vĩnh viễn.");
            return;
        }

        log.info("Tìm thấy {} items hết hạn trong thùng rác. Đang tiến hành xoá...", expiredNodes.size());

        int successCount = 0;
        int failCount = 0;

        for (FileNode node : expiredNodes) {
            try {
                // 2. Tái sử dụng logic deletePermanently
                // Vì deletePermanently yêu cầu userId để check quyền -> Ta truyền chính ownerId của node
                // Hàm này đã bao gồm: Check quyền, Rescue Orphan, Recursive Delete, Sync Elastic...
                FileIdListRequest request = new FileIdListRequest();
                request.setIds(Collections.singletonList(node.getId()));

                fileStorageService.deletePermanently(request, node.getOwnerId());

                successCount++;
            } catch (Exception e) {
                log.error("Lỗi khi xoá vĩnh viễn file ID: {} - Lý do: {}", node.getId(), e.getMessage());
                failCount++;
            }
        }

        log.info("--- Kết thúc dọn dẹp Thùng Rác. Thành công: {}, Thất bại: {} ---", successCount, failCount);
    }
}