package com.dishan.warehouse.product.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProductResponse {

    private UUID id;

    private String name;

    private String sku;

    private String description;

    private BigDecimal price;

    private Integer quantity;

    private Integer minStock;

    private ProductStatus status;

    private UUID categoryId;

    private String categoryName;

    private UUID supplierId;

    private String supplierName;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
