package com.dishan.warehouse.dashboard.service.impl;

import com.dishan.warehouse.category.repository.CategoryRepository;
import com.dishan.warehouse.dashboard.dto.CategoryProductCount;
import com.dishan.warehouse.dashboard.dto.DashboardSummaryResponse;
import com.dishan.warehouse.dashboard.dto.LowStockProductResponse;
import com.dishan.warehouse.dashboard.dto.MonthlyMovementStats;
import com.dishan.warehouse.dashboard.dto.RecentMovementResponse;
import com.dishan.warehouse.dashboard.service.DashboardService;
import com.dishan.warehouse.entity.MovementType;
import com.dishan.warehouse.entity.StockMovement;
import com.dishan.warehouse.movement.repository.StockMovementRepository;
import com.dishan.warehouse.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final int LOW_STOCK_LIMIT = 5;
    private static final int MONTHS_BACK = 5;

    private final ProductRepository productRepository;

    private final CategoryRepository categoryRepository;

    private final StockMovementRepository movementRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {

        List<LowStockProductResponse> lowStockProducts = productRepository
                .findLowStockProducts(PageRequest.of(0, LOW_STOCK_LIMIT))
                .stream()
                .map(product -> LowStockProductResponse.builder()
                        .id(product.getId())
                        .name(product.getName())
                        .sku(product.getSku())
                        .quantity(product.getQuantity())
                        .minStock(product.getMinStock())
                        .build())
                .toList();

        List<CategoryProductCount> productsPerCategory = productRepository
                .countProductsByCategory()
                .stream()
                .map(projection -> CategoryProductCount.builder()
                        .name(projection.getName())
                        .productCount(projection.getProductCount())
                        .build())
                .toList();

        List<RecentMovementResponse> recentMovements = movementRepository
                .findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(DashboardServiceImpl::toRecentMovement)
                .toList();

        return DashboardSummaryResponse.builder()
                .totalProducts(productRepository.count())
                .totalCategories(categoryRepository.count())
                .lowStockCount(productRepository.countLowStock())
                .outOfStockCount(productRepository.countOutOfStock())
                .lowStockProducts(lowStockProducts)
                .productsPerCategory(productsPerCategory)
                .recentMovements(recentMovements)
                .monthlyMovements(buildMonthlyStats())
                .build();
    }

    private List<MonthlyMovementStats> buildMonthlyStats() {

        YearMonth currentMonth = YearMonth.now();
        LocalDateTime start = currentMonth.minusMonths(MONTHS_BACK).atDay(1).atStartOfDay();

        Map<YearMonth, long[]> totals = new TreeMap<>();
        for (int i = MONTHS_BACK; i >= 0; i--) {
            totals.put(currentMonth.minusMonths(i), new long[]{0, 0});
        }

        for (StockMovement movement : movementRepository.findByCreatedAtAfter(start)) {
            YearMonth yearMonth = YearMonth.from(movement.getCreatedAt());
            long[] bucket = totals.get(yearMonth);
            if (bucket == null) {
                continue;
            }
            if (movement.getType() == MovementType.INBOUND) {
                bucket[0] += movement.getQuantity();
            } else if (movement.getType() == MovementType.OUTBOUND) {
                bucket[1] += movement.getQuantity();
            }
        }

        return totals.entrySet().stream()
                .map(entry -> MonthlyMovementStats.builder()
                        .month(entry.getKey().toString())
                        .inbound(entry.getValue()[0])
                        .outbound(entry.getValue()[1])
                        .build())
                .toList();
    }

    private static RecentMovementResponse toRecentMovement(StockMovement movement) {

        return RecentMovementResponse.builder()
                .id(movement.getId())
                .productName(movement.getProduct().getName())
                .sku(movement.getProduct().getSku())
                .type(movement.getType())
                .quantity(movement.getQuantity())
                .reason(movement.getReason())
                .performedBy(movement.getPerformedBy())
                .createdAt(movement.getCreatedAt())
                .build();
    }

}
