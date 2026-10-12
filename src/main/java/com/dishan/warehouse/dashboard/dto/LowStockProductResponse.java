package com.dishan.warehouse.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class LowStockProductResponse {

    private UUID id;

    private String name;

    private String sku;

    private Integer quantity;

    private Integer minStock;

}
