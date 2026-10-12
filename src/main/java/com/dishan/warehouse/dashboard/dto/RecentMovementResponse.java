package com.dishan.warehouse.dashboard.dto;

import com.dishan.warehouse.entity.MovementType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RecentMovementResponse {

    private UUID id;

    private String productName;

    private String sku;

    private MovementType type;

    private Integer quantity;

    private String reason;

    private String performedBy;

    private LocalDateTime createdAt;

}
