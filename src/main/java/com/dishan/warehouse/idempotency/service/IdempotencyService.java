package com.dishan.warehouse.idempotency.service;

import com.dishan.warehouse.idempotency.entity.IdempotencyRecord;
import com.dishan.warehouse.idempotency.entity.IdempotencyStatus;
import com.dishan.warehouse.idempotency.exception.IdempotencyConflictException;
import com.dishan.warehouse.idempotency.exception.IdempotencyInProgressException;
import com.dishan.warehouse.idempotency.repository.IdempotencyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final IdempotencyRepository repository;

    /**
     * Checks the idempotency key in an isolated transaction using pessimistic write locking.
     * Scoped to the authenticated user, HTTP method, request URI, and key.
     * Returns an existing completed record if available for replay,
     * or reserves the key as IN_FLIGHT.
     *
     * @return IdempotencyRecord if completed (replay), null if newly reserved (proceed)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public IdempotencyRecord processOrReserve(
            String userId,
            String httpMethod,
            String requestUri,
            String key,
            String requestHash
    ) {
        // Acquire row-level pessimistic write lock on existing record to prevent race conditions during recovery
        Optional<IdempotencyRecord> existingOpt = repository.findForUpdate(userId, httpMethod, requestUri, key);

        if (existingOpt.isPresent()) {
            IdempotencyRecord existing = existingOpt.get();

            // Reject payload mismatch across all states (COMPLETED, IN_FLIGHT, FAILED)
            if (!existing.getRequestHash().equals(requestHash)) {
                log.warn("Idempotency key '{}' for user '{}' on {} {} reused with different request hash",
                        key, userId, httpMethod, requestUri);
                throw new IdempotencyConflictException("Idempotency key reused with different request payload");
            }

            if (existing.getStatus() == IdempotencyStatus.COMPLETED) {
                log.info("Idempotency key '{}' matched existing completed record, replaying response", key);
                return existing;
            }

            if (existing.getStatus() == IdempotencyStatus.IN_FLIGHT) {
                // If it's expired in-flight (e.g. previous worker crashed), allow recovery under row lock
                if (existing.getExpiresAt().isBefore(LocalDateTime.now())) {
                    log.info("Idempotency key '{}' had expired IN_FLIGHT state, re-claiming slot under lock", key);
                    existing.setExpiresAt(LocalDateTime.now().plusMinutes(2));
                    return repository.saveAndFlush(existing);
                }
                log.warn("Idempotency key '{}' currently in progress", key);
                throw new IdempotencyInProgressException("Request with this idempotency key is currently processing");
            }

            if (existing.getStatus() == IdempotencyStatus.FAILED) {
                // Previous attempt failed, allow retry under row lock
                log.info("Idempotency key '{}' had FAILED state, re-claiming slot for retry under lock", key);
                existing.setStatus(IdempotencyStatus.IN_FLIGHT);
                existing.setExpiresAt(LocalDateTime.now().plusMinutes(2));
                return repository.saveAndFlush(existing);
            }
        }

        // New key: reserve slot as IN_FLIGHT with a short lease (2 minutes)
        try {
            IdempotencyRecord record = IdempotencyRecord.builder()
                    .userId(userId)
                    .httpMethod(httpMethod)
                    .requestUri(requestUri)
                    .idempotencyKey(key)
                    .requestHash(requestHash)
                    .status(IdempotencyStatus.IN_FLIGHT)
                    .createdAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusMinutes(2))
                    .build();
            return repository.saveAndFlush(record);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Concurrent insert race for idempotency key '{}' for user '{}' on {} {}",
                    key, userId, httpMethod, requestUri);
            throw new IdempotencyInProgressException("Request with this idempotency key is currently processing");
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void complete(String userId, String httpMethod, String requestUri, String key, int responseStatus, String responseBody) {
        repository.findForUpdate(userId, httpMethod, requestUri, key).ifPresent(record -> {
            record.setStatus(IdempotencyStatus.COMPLETED);
            record.setResponseStatus(responseStatus);
            record.setResponseBody(responseBody);
            record.setExpiresAt(LocalDateTime.now().plusHours(24));
            repository.saveAndFlush(record);
            log.debug("Marked idempotency key '{}' as COMPLETED with status {}", key, responseStatus);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void fail(String userId, String httpMethod, String requestUri, String key) {
        repository.findForUpdate(userId, httpMethod, requestUri, key).ifPresent(record -> {
            record.setStatus(IdempotencyStatus.FAILED);
            record.setExpiresAt(LocalDateTime.now().plusHours(24));
            repository.saveAndFlush(record);
            log.debug("Marked idempotency key '{}' as FAILED", key);
        });
    }
}
