package com.dishan.warehouse.idempotency.repository;

import com.dishan.warehouse.idempotency.entity.IdempotencyRecord;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IdempotencyRepository extends JpaRepository<IdempotencyRecord, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM IdempotencyRecord r WHERE r.userId = :userId AND r.httpMethod = :httpMethod AND r.requestUri = :requestUri AND r.idempotencyKey = :idempotencyKey")
    Optional<IdempotencyRecord> findForUpdate(
            @Param("userId") String userId,
            @Param("httpMethod") String httpMethod,
            @Param("requestUri") String requestUri,
            @Param("idempotencyKey") String idempotencyKey
    );

    Optional<IdempotencyRecord> findByUserIdAndHttpMethodAndRequestUriAndIdempotencyKey(
            String userId,
            String httpMethod,
            String requestUri,
            String idempotencyKey
    );

    void deleteByExpiresAtBefore(LocalDateTime now);
}
