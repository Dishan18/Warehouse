package com.dishan.warehouse.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_movement", indexes = {
        @Index(name = "idx_stock_movement_idempotency", columnList = "idempotency_key")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovementType type;

    @NotNull
    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Integer beforeQuantity;

    @Column(nullable = false)
    private Integer afterQuantity;

    @NotBlank(message = "Reason is required")
    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private String performedBy;

    @Column(name = "idempotency_key", length = 128)
    private String idempotencyKey;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

}
