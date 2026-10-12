package com.dishan.warehouse.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "SKU is required")
    @Size(max = 50)
    private String sku;

    @Size(max = 500)
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be positive")
    private Integer quantity;

    @NotNull(message = "Minimum stock is required")
    @Min(value = 0, message = "Minimum stock must be positive")
    private Integer minStock;

    @NotNull(message = "Category is required")
    private UUID categoryId;

    private UUID supplierId;

    private Boolean active = true;

}
