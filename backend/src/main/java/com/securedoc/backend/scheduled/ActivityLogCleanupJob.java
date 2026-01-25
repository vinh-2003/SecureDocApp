package com.securedoc.backend.scheduled;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.securedoc.backend.service.ActivityLogService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ActivityLogCleanupJob {

    private final ActivityLogService activityLogService;

    @Value("${app.activity-log.retention-days:365}")
    private int retentionDays;

    /**
     * Chạy vào 3h sáng mỗi ngày để dọn dẹp activity logs cũ.
     */
    @Scheduled(cron = "0 0 3 * * ? ")
    public void cleanupOldActivityLogs() {
        log.info("Starting activity log cleanup job...");
        try {
            activityLogService.cleanupOldActivities(retentionDays);
            log.info("Activity log cleanup completed successfully");
        } catch (Exception e) {
            log.error("Activity log cleanup failed:  {}", e.getMessage());
        }
    }
}
