package com.dishan.warehouse.settings.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SettingsResponse {

    private String warehouseName;

    private String currency;

    private Integer lowStockThreshold;

    private Boolean notificationsEnabled;

    private LocalDateTime updatedAt;

}
