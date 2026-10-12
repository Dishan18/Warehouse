package com.dishan.warehouse.movement.dto;

import com.dishan.warehouse.entity.MovementType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MovementResponse {

    private UUID id;

    private UUID productId;

    private String productName;

    private String sku;

    private MovementType type;

    private Integer quantity;

    private Integer beforeQuantity;

    private Integer afterQuantity;

    private String reason;

    private String performedBy;

    private LocalDateTime createdAt;

}
