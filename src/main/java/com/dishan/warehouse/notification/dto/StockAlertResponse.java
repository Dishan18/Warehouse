package com.dishan.warehouse.notification.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class StockAlertResponse {

    private UUID productId;

    private String productName;

    private String sku;

    private Integer quantity;

    private Integer minStock;

    private String type;

    private LocalDateTime createdAt;

}
