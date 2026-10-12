package com.dishan.warehouse.settings.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SettingsRequest(

        @NotBlank(message = "Warehouse name is required")
        @Size(max = 150)
        String warehouseName,

        @NotBlank(message = "Currency is required")
        @Size(max = 10)
        String currency,

        @NotNull(message = "Low stock threshold is required")
        @Min(value = 0, message = "Low stock threshold must be positive")
        Integer lowStockThreshold,

        @NotNull(message = "Notifications flag is required")
        Boolean notificationsEnabled

) {
}
