package com.dishan.warehouse.report.dto;

import java.math.BigDecimal;
import java.util.List;

public record InventoryReportResponse(
        long totalProducts,
        long totalCategories,
        long totalSuppliers,
        long lowStockProducts,
        long outOfStockProducts,
        BigDecimal totalInventoryValue,
        List<CategoryBreakdownItem> productsByCategory,
        List<DailyMovementItem> stockMovements,
        List<TopProductItem> topProductsByMovement,
        List<SupplierPerformanceItem> supplierPerformance) {

    public record CategoryBreakdownItem(String category, long count, BigDecimal value) {
    }

    public record DailyMovementItem(String date, long in, long out) {
    }

    public record TopProductItem(String product, long movements) {
    }

    public record SupplierPerformanceItem(String supplier, long products, BigDecimal totalValue) {
    }
}
