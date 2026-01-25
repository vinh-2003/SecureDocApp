package com.securedoc.backend.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Thread pool riêng cho Activity Logging. Tách biệt khỏi main thread pool
     * để không ảnh hưởng performance.
     */
    @Bean(name = "activityLogExecutor")
    public Executor activityLogExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // Core pool:  Số thread tối thiểu luôn sẵn sàng
        executor.setCorePoolSize(2);

        // Max pool: Số thread tối đa khi queue đầy
        executor.setMaxPoolSize(5);

        // Queue capacity: Số task chờ trong hàng đợi
        executor.setQueueCapacity(500);

        // Thread name prefix (để debug)
        executor.setThreadNamePrefix("ActivityLog-");

        // Khi shutdown, đợi các task hoàn thành
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);

        executor.initialize();
        return executor;
    }
}
