package com.dishan.warehouse.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Enables Spring @Async and provides a named thread pool for post-commit
 * stock-alert WebSocket dispatches. Keeping alerts on a dedicated pool
 * prevents them from consuming the common task executor and avoids contention
 * with other async work in the application.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "stockAlertExecutor")
    public Executor stockAlertExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("alert-pool-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }

}
