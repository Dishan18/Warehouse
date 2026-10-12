package com.dishan.warehouse.movement.repository;

import com.dishan.warehouse.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

import org.springframework.data.repository.query.Param;

public interface StockMovementRepository
        extends JpaRepository<StockMovement, UUID>, JpaSpecificationExecutor<StockMovement> {

    List<StockMovement> findTop5ByOrderByCreatedAtDesc();

    java.util.Optional<StockMovement> findByIdempotencyRecordId(UUID idempotencyRecordId);

    java.util.Optional<StockMovement> findByIdempotencyKey(String idempotencyKey);

    List<StockMovement> findByCreatedAtAfter(java.time.LocalDateTime date);

    List<StockMovement> findByCreatedAtBetween(java.time.LocalDateTime from, java.time.LocalDateTime to);

    Page<StockMovement> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
            SELECT m.product.name AS name, COUNT(m.id) AS movementCount
            FROM StockMovement m
            WHERE m.createdAt BETWEEN :from AND :to
            GROUP BY m.product.id, m.product.name
            ORDER BY COUNT(m.id) DESC
            """)
    List<TopProductProjection> findTopProductsByMovement(
            @Param("from") java.time.LocalDateTime from,
            @Param("to") java.time.LocalDateTime to,
            Pageable pageable);

    interface TopProductProjection {
        String getName();
        long getMovementCount();
    }

}
