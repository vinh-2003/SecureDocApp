package com.securedoc.backend.scheduled;

import com.securedoc.backend.repository.AccessLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Slf4j
@RequiredArgsConstructor
public class AccessLogCleanupJob {

    private final MongoTemplate mongoTemplate;

    @Value("${app.log.retention-days:30}")
    private int retentionDays;

    // Chạy lúc 2:00 AM mỗi ngày
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupOldLogs() {
        log.info("Bắt đầu dọn dẹp Access Log cũ hơn {} ngày...", retentionDays);

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);

        Query query = new Query();
        query.addCriteria(Criteria.where("timestamp").lt(cutoffDate));

        var result = mongoTemplate.remove(query, "access_logs");

        log.info("Đã xóa {} dòng Access Log cũ.", result.getDeletedCount());
    }
}