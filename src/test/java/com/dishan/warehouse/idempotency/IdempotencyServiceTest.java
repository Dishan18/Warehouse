package com.dishan.warehouse.idempotency;

import com.dishan.warehouse.idempotency.entity.IdempotencyRecord;
import com.dishan.warehouse.idempotency.entity.IdempotencyStatus;
import com.dishan.warehouse.idempotency.exception.IdempotencyConflictException;
import com.dishan.warehouse.idempotency.exception.IdempotencyInProgressException;
import com.dishan.warehouse.idempotency.repository.IdempotencyRepository;
import com.dishan.warehouse.idempotency.service.IdempotencyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IdempotencyServiceTest {

    @Mock
    private IdempotencyRepository repository;

    @InjectMocks
    private IdempotencyService service;

    private final String userId = "user@warehouse.com";
    private final String httpMethod = "POST";
    private final String requestUri = "/api/movements/outbound";
    private final String key = "test-key-123";
    private final String hash = "abc123hash";

    @Test
    void processOrReserve_whenNewKey_savesInFlightAndReturnsNull() {
        when(repository.findForUpdate(userId, httpMethod, requestUri, key)).thenReturn(Optional.empty());

        IdempotencyRecord result = service.processOrReserve(userId, httpMethod, requestUri, key, hash);

        assertNull(result);
        ArgumentCaptor<IdempotencyRecord> captor = ArgumentCaptor.forClass(IdempotencyRecord.class);
        verify(repository).saveAndFlush(captor.capture());

        IdempotencyRecord saved = captor.getValue();
        assertEquals(userId, saved.getUserId());
        assertEquals(httpMethod, saved.getHttpMethod());
        assertEquals(requestUri, saved.getRequestUri());
        assertEquals(key, saved.getIdempotencyKey());
        assertEquals(hash, saved.getRequestHash());
        assertEquals(IdempotencyStatus.IN_FLIGHT, saved.getStatus());
    }

    @Test
    void processOrReserve_whenCompletedAndHashMatches_returnsRecord() {
        IdempotencyRecord completed = IdempotencyRecord.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .httpMethod(httpMethod)
                .requestUri(requestUri)
                .idempotencyKey(key)
                .requestHash(hash)
                .status(IdempotencyStatus.COMPLETED)
                .responseStatus(200)
                .responseBody("{\"success\":true}")
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        when(repository.findForUpdate(userId, httpMethod, requestUri, key)).thenReturn(Optional.of(completed));

        IdempotencyRecord result = service.processOrReserve(userId, httpMethod, requestUri, key, hash);

        assertNotNull(result);
        assertEquals(200, result.getResponseStatus());
        assertEquals("{\"success\":true}", result.getResponseBody());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void processOrReserve_whenCompletedAndHashDiffers_throwsConflict() {
        IdempotencyRecord completed = IdempotencyRecord.builder()
                .userId(userId)
                .httpMethod(httpMethod)
                .requestUri(requestUri)
                .idempotencyKey(key)
                .requestHash("different-hash")
                .status(IdempotencyStatus.COMPLETED)
                .build();

        when(repository.findForUpdate(userId, httpMethod, requestUri, key)).thenReturn(Optional.of(completed));

        assertThrows(IdempotencyConflictException.class, () ->
                service.processOrReserve(userId, httpMethod, requestUri, key, hash));
    }

    @Test
    void processOrReserve_whenInFlightAndNotExpired_throwsInProgressException() {
        IdempotencyRecord inFlight = IdempotencyRecord.builder()
                .userId(userId)
                .httpMethod(httpMethod)
                .requestUri(requestUri)
                .idempotencyKey(key)
                .requestHash(hash)
                .status(IdempotencyStatus.IN_FLIGHT)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();

        when(repository.findForUpdate(userId, httpMethod, requestUri, key)).thenReturn(Optional.of(inFlight));

        assertThrows(IdempotencyInProgressException.class, () ->
                service.processOrReserve(userId, httpMethod, requestUri, key, hash));
    }

    @Test
    void processOrReserve_whenInFlightExpired_allowsRecoveryUnderLock() {
        IdempotencyRecord expiredInFlight = IdempotencyRecord.builder()
                .userId(userId)
                .httpMethod(httpMethod)
                .requestUri(requestUri)
                .idempotencyKey(key)
                .requestHash("old-hash")
                .status(IdempotencyStatus.IN_FLIGHT)
                .expiresAt(LocalDateTime.now().minusMinutes(5))
                .build();

        when(repository.findForUpdate(userId, httpMethod, requestUri, key)).thenReturn(Optional.of(expiredInFlight));

        IdempotencyRecord result = service.processOrReserve(userId, httpMethod, requestUri, key, hash);

        assertNull(result);
        verify(repository).saveAndFlush(expiredInFlight);
        assertEquals(hash, expiredInFlight.getRequestHash());
        assertTrue(expiredInFlight.getExpiresAt().isAfter(LocalDateTime.now()));
    }

    @Test
    void processOrReserve_whenFailedState_allowsRecoveryUnderLock() {
        IdempotencyRecord failedRecord = IdempotencyRecord.builder()
                .userId(userId)
                .httpMethod(httpMethod)
                .requestUri(requestUri)
                .idempotencyKey(key)
                .requestHash("failed-attempt-hash")
                .status(IdempotencyStatus.FAILED)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();

        when(repository.findForUpdate(userId, httpMethod, requestUri, key)).thenReturn(Optional.of(failedRecord));

        IdempotencyRecord result = service.processOrReserve(userId, httpMethod, requestUri, key, hash);

        assertNull(result);
        verify(repository).saveAndFlush(failedRecord);
        assertEquals(IdempotencyStatus.IN_FLIGHT, failedRecord.getStatus());
        assertEquals(hash, failedRecord.getRequestHash());
        assertTrue(failedRecord.getExpiresAt().isAfter(LocalDateTime.now()));
    }

    @Test
    void processOrReserve_whenConcurrentInsertRace_throwsInProgressException() {
        when(repository.findForUpdate(userId, httpMethod, requestUri, key)).thenReturn(Optional.empty());
        when(repository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("Unique constraint violation"));

        assertThrows(IdempotencyInProgressException.class, () ->
                service.processOrReserve(userId, httpMethod, requestUri, key, hash));
    }

    @Test
    void complete_updatesStatusAndResponseBody() {
        IdempotencyRecord record = IdempotencyRecord.builder()
                .userId(userId)
                .httpMethod(httpMethod)
                .requestUri(requestUri)
                .idempotencyKey(key)
                .status(IdempotencyStatus.IN_FLIGHT)
                .build();

        when(repository.findForUpdate(userId, httpMethod, requestUri, key)).thenReturn(Optional.of(record));

        service.complete(userId, httpMethod, requestUri, key, 201, "{\"id\":1}");

        assertEquals(IdempotencyStatus.COMPLETED, record.getStatus());
        assertEquals(201, record.getResponseStatus());
        assertEquals("{\"id\":1}", record.getResponseBody());
        verify(repository).saveAndFlush(record);
    }

    @Test
    void fail_marksRecordAsFailed() {
        IdempotencyRecord record = IdempotencyRecord.builder()
                .userId(userId)
                .httpMethod(httpMethod)
                .requestUri(requestUri)
                .idempotencyKey(key)
                .status(IdempotencyStatus.IN_FLIGHT)
                .build();

        when(repository.findForUpdate(userId, httpMethod, requestUri, key)).thenReturn(Optional.of(record));

        service.fail(userId, httpMethod, requestUri, key);

        assertEquals(IdempotencyStatus.FAILED, record.getStatus());
        verify(repository).saveAndFlush(record);
    }
}
