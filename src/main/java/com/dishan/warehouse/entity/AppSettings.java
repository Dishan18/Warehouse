package com.dishan.warehouse.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "app_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Warehouse name is required")
    @Size(max = 150)
    @Column(name = "warehouse_name", nullable = false, length = 150)
    private String warehouseName;

    @NotBlank(message = "Currency is required")
    @Size(max = 10)
    @Column(nullable = false, length = 10)
    private String currency;

    @NotNull(message = "Low stock threshold is required")
    @Min(value = 0, message = "Low stock threshold must be positive")
    @Column(name = "low_stock_threshold", nullable = false)
    private Integer lowStockThreshold;

    @Builder.Default
    @Column(name = "notifications_enabled", nullable = false)
    private Boolean notificationsEnabled = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}
