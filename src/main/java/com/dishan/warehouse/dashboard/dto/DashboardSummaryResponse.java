package com.dishan.warehouse.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DashboardSummaryResponse {

    private long totalProducts;

    private long totalCategories;

    private long lowStockCount;

    private long outOfStockCount;

    private List<LowStockProductResponse> lowStockProducts;

    private List<CategoryProductCount> productsPerCategory;

    private List<RecentMovementResponse> recentMovements;

    private List<MonthlyMovementStats> monthlyMovements;

}
