package com.dishan.warehouse.dashboard.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MonthlyMovementStats {

    private String month;

    private long inbound;

    private long outbound;

}
