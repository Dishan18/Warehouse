package com.dishan.warehouse.idempotency;

import com.dishan.warehouse.config.TestcontainersConfig;
import com.dishan.warehouse.idempotency.entity.IdempotencyRecord;
import com.dishan.warehouse.idempotency.entity.IdempotencyStatus;
import com.dishan.warehouse.idempotency.exception.IdempotencyInProgressException;
import com.dishan.warehouse.idempotency.repository.IdempotencyRepository;
import com.dishan.warehouse.idempotency.service.IdempotencyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
@EnabledIf("isDockerAvailable")
class IdempotencyPostgresConcurrencyIT {

    static boolean isDockerAvailable() {
        try {
            return org.testcontainers.DockerClientFactory.instance().isDockerAvailable();
        } catch (Throwable t) {
            return false;
        }
    }

    @Autowired
    private IdempotencyService idempotencyService;

    @Autowired
    private IdempotencyRepository idempotencyRepository;

    @BeforeEach
    void cleanUp() {
        idempotencyRepository.deleteAll();
    }

    @Test
    @DisplayName("Concurrent retry of expired IN_FLIGHT key allows exactly 1 thread to recover and blocks all others")
    void concurrentRetryOfExpiredInFlightKey_allowsExactlyOneThread() throws Exception {
        String key = "retry-expired-" + UUID.randomUUID();
        String userId = "operator@warehouse.com";
        String method = "POST";
        String uri = "/api/movements/outbound";
        String payloadHash = "consistent-payload-hash";

        // Seed expired IN_FLIGHT record directly in DB
        IdempotencyRecord expiredRecord = IdempotencyRecord.builder()
                .userId(userId)
                .httpMethod(method)
                .requestUri(uri)
                .idempotencyKey(key)
                .requestHash(payloadHash)
                .status(IdempotencyStatus.IN_FLIGHT)
                .createdAt(LocalDateTime.now().minusHours(2))
                .expiresAt(LocalDateTime.now().minusMinutes(10))
                .build();
        idempotencyRepository.saveAndFlush(expiredRecord);

        int threadCount = 8;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successProceedCount = new AtomicInteger(0);
        AtomicInteger inProgressBlockedCount = new AtomicInteger(0);
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    IdempotencyRecord record = idempotencyService.processOrReserve(
                            userId, method, uri, key, payloadHash
                    );
                    if (record != null && record.getStatus() == IdempotencyStatus.IN_FLIGHT) {
                        // Recovered slot and reserved to proceed
                        successProceedCount.incrementAndGet();
                    }
                } catch (IdempotencyInProgressException ex) {
                    inProgressBlockedCount.incrementAndGet();
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            }));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Release all threads simultaneously

        for (Future<?> f : futures) {
            f.get(10, TimeUnit.SECONDS);
        }
        executor.shutdown();

        // Exactly one thread must have successfully recovered under the pessimistic lock
        assertThat(successProceedCount.get()).isEqualTo(1);
        // All other concurrent attempts must have been rejected as in-progress
        assertThat(inProgressBlockedCount.get()).isEqualTo(threadCount - 1);

        // Verify the database record has been renewed with short in-flight lease
        IdempotencyRecord updated = idempotencyRepository.findForUpdate(userId, method, uri, key).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(IdempotencyStatus.IN_FLIGHT);
        assertThat(updated.getExpiresAt()).isAfter(LocalDateTime.now().plusSeconds(60));
    }

    @Test
    @DisplayName("Concurrent retry of FAILED record allows exactly 1 thread to recover and blocks all others")
    void concurrentRetryOfFailedRecord_allowsExactlyOneThread() throws Exception {
        String key = "retry-failed-" + UUID.randomUUID();
        String userId = "operator@warehouse.com";
        String method = "POST";
        String uri = "/api/movements/outbound";
        String payloadHash = "original-failed-hash";

        // Seed FAILED record directly in DB
        IdempotencyRecord failedRecord = IdempotencyRecord.builder()
                .userId(userId)
                .httpMethod(method)
                .requestUri(uri)
                .idempotencyKey(key)
                .requestHash(payloadHash)
                .status(IdempotencyStatus.FAILED)
                .createdAt(LocalDateTime.now().minusMinutes(5))
                .expiresAt(LocalDateTime.now().plusHours(23))
                .build();
        idempotencyRepository.saveAndFlush(failedRecord);

        int threadCount = 8;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successProceedCount = new AtomicInteger(0);
        AtomicInteger inProgressBlockedCount = new AtomicInteger(0);
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    IdempotencyRecord record = idempotencyService.processOrReserve(
                            userId, method, uri, key, payloadHash
                    );
                    if (record != null && record.getStatus() == IdempotencyStatus.IN_FLIGHT) {
                        successProceedCount.incrementAndGet();
                    }
                } catch (IdempotencyInProgressException ex) {
                    inProgressBlockedCount.incrementAndGet();
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            }));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        for (Future<?> f : futures) {
            f.get(10, TimeUnit.SECONDS);
        }
        executor.shutdown();

        // Exactly one thread must have recovered from FAILED state
        assertThat(successProceedCount.get()).isEqualTo(1);
        assertThat(inProgressBlockedCount.get()).isEqualTo(threadCount - 1);

        // Record should now be IN_FLIGHT
        IdempotencyRecord updated = idempotencyRepository.findForUpdate(userId, method, uri, key).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(IdempotencyStatus.IN_FLIGHT);
        assertThat(updated.getExpiresAt()).isAfter(LocalDateTime.now().plusSeconds(60));
    }

    @Test
    @DisplayName("Concurrent first-time reservation race allows exactly 1 thread and catches unique constraint violation")
    void concurrentInitialReservation_allowsExactlyOneThread() throws Exception {
        String key = "initial-race-" + UUID.randomUUID();
        String userId = "operator@warehouse.com";
        String method = "POST";
        String uri = "/api/movements/inbound";
        String hash = "payload-hash";

        int threadCount = 8;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successProceedCount = new AtomicInteger(0);
        AtomicInteger inProgressBlockedCount = new AtomicInteger(0);
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    IdempotencyRecord record = idempotencyService.processOrReserve(
                            userId, method, uri, key, hash
                    );
                    if (record != null && record.getStatus() == IdempotencyStatus.IN_FLIGHT) {
                        successProceedCount.incrementAndGet();
                    }
                } catch (IdempotencyInProgressException ex) {
                    inProgressBlockedCount.incrementAndGet();
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            }));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        for (Future<?> f : futures) {
            f.get(10, TimeUnit.SECONDS);
        }
        executor.shutdown();

        assertThat(successProceedCount.get()).isEqualTo(1);
        assertThat(inProgressBlockedCount.get()).isEqualTo(threadCount - 1);
    }

    @Test
    @DisplayName("Different users and endpoints using the exact same idempotency key do not collide")
    void scopedKeyIsolation_preventsCollisionsBetweenUsersAndEndpoints() {
        String commonKey = "shared-uuid-key";

        // User A calls /api/movements/inbound
        IdempotencyRecord r1 = idempotencyService.processOrReserve(
                "userA@warehouse.com", "POST", "/api/movements/inbound", commonKey, "hashA"
        );
        assertThat(r1).isNotNull();
        assertThat(r1.getStatus()).isEqualTo(IdempotencyStatus.IN_FLIGHT);

        // User B calls /api/movements/inbound with the same key
        IdempotencyRecord r2 = idempotencyService.processOrReserve(
                "userB@warehouse.com", "POST", "/api/movements/inbound", commonKey, "hashB"
        );
        assertThat(r2).isNotNull();
        assertThat(r2.getStatus()).isEqualTo(IdempotencyStatus.IN_FLIGHT);
        assertThat(r2.getId()).isNotEqualTo(r1.getId());

        // User A calls /api/movements/outbound with the same key
        IdempotencyRecord r3 = idempotencyService.processOrReserve(
                "userA@warehouse.com", "POST", "/api/movements/outbound", commonKey, "hashA2"
        );
        assertThat(r3).isNotNull();
        assertThat(r3.getStatus()).isEqualTo(IdempotencyStatus.IN_FLIGHT);
        assertThat(r3.getId()).isNotEqualTo(r1.getId());
    }
}
