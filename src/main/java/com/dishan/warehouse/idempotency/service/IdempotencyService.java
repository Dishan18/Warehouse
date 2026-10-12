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
     * Checks the idempotency key in an isolated transaction.
     * Returns an existing completed record if available for replay,
     * or reserves the key as IN_FLIGHT.
     *
     * @return IdempotencyRecord if completed (replay), null if newly reserved (proceed)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public IdempotencyRecord processOrReserve(String key, String requestHash) {
        Optional<IdempotencyRecord> existingOpt = repository.findByIdempotencyKey(key);

        if (existingOpt.isPresent()) {
            IdempotencyRecord existing = existingOpt.get();

            if (existing.getStatus() == IdempotencyStatus.COMPLETED) {
                if (!existing.getRequestHash().equals(requestHash)) {
                    log.warn("Idempotency key '{}' reused with different request hash", key);
                    throw new IdempotencyConflictException("Idempotency key reused with different request payload");
                }
                log.info("Idempotency key '{}' matched existing completed record, replaying response", key);
                return existing;
            }

            if (existing.getStatus() == IdempotencyStatus.IN_FLIGHT) {
                // If it's expired in-flight (e.g. process crashed), allow recovery
                if (existing.getExpiresAt().isBefore(LocalDateTime.now())) {
                    log.info("Idempotency key '{}' had expired IN_FLIGHT state, re-claiming", key);
                    existing.setRequestHash(requestHash);
                    existing.setExpiresAt(LocalDateTime.now().plusHours(24));
                    return null;
                }
                log.warn("Idempotency key '{}' currently in progress", key);
                throw new IdempotencyInProgressException("Request with this idempotency key is currently processing");
            }

            if (existing.getStatus() == IdempotencyStatus.FAILED) {
                // Previous attempt failed, allow retry with same key
                existing.setStatus(IdempotencyStatus.IN_FLIGHT);
                existing.setRequestHash(requestHash);
                existing.setExpiresAt(LocalDateTime.now().plusHours(24));
                repository.save(existing);
                return null;
            }
        }

        // New key: reserve slot as IN_FLIGHT
        try {
            IdempotencyRecord record = IdempotencyRecord.builder()
                    .idempotencyKey(key)
                    .requestHash(requestHash)
                    .status(IdempotencyStatus.IN_FLIGHT)
                    .createdAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusHours(24))
                    .build();
            repository.saveAndFlush(record);
            return null;
        } catch (DataIntegrityViolationException ex) {
            log.warn("Concurrent insert race for idempotency key '{}'", key);
            throw new IdempotencyInProgressException("Request with this idempotency key is currently processing");
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void complete(String key, int responseStatus, String responseBody) {
        repository.findByIdempotencyKey(key).ifPresent(record -> {
            record.setStatus(IdempotencyStatus.COMPLETED);
            record.setResponseStatus(responseStatus);
            record.setResponseBody(responseBody);
            repository.save(record);
            log.debug("Marked idempotency key '{}' as COMPLETED with status {}", key, responseStatus);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void fail(String key) {
        repository.findByIdempotencyKey(key).ifPresent(record -> {
            record.setStatus(IdempotencyStatus.FAILED);
            repository.save(record);
            log.debug("Marked idempotency key '{}' as FAILED", key);
        });
    }
}
