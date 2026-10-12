package com.dishan.warehouse.report.service.impl;

import com.dishan.warehouse.category.repository.CategoryRepository;
import com.dishan.warehouse.entity.MovementType;
import com.dishan.warehouse.entity.StockMovement;
import com.dishan.warehouse.movement.repository.StockMovementRepository;
import com.dishan.warehouse.product.repository.ProductRepository;
import com.dishan.warehouse.report.dto.InventoryReportResponse;
import com.dishan.warehouse.report.service.AnalyticsReportService;
import com.dishan.warehouse.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsReportServiceImpl implements AnalyticsReportService {

    private final ProductRepository productRepository;

    private final CategoryRepository categoryRepository;

    private final SupplierRepository supplierRepository;

    private final StockMovementRepository movementRepository;

    @Override
    @Transactional(readOnly = true)
    public InventoryReportResponse generateInventoryReport(LocalDateTime from, LocalDateTime to) {

        LocalDateTime effectiveFrom = from != null ? from : LocalDateTime.now().minusDays(30);
        LocalDateTime effectiveTo = to != null ? to : LocalDateTime.now();

        List<InventoryReportResponse.CategoryBreakdownItem> byCategory = productRepository
                .categoryBreakdown()
                .stream()
                .map(item -> new InventoryReportResponse.CategoryBreakdownItem(
                        item.getName(), item.getProductCount(), item.getTotalValue()))
                .toList();

        List<InventoryReportResponse.TopProductItem> topProducts = movementRepository
                .findTopProductsByMovement(effectiveFrom, effectiveTo, PageRequest.of(0, 5))
                .stream()
                .map(item -> new InventoryReportResponse.TopProductItem(
                        item.getName(), item.getMovementCount()))
                .toList();

        List<InventoryReportResponse.SupplierPerformanceItem> suppliers = productRepository
                .supplierPerformance()
                .stream()
                .map(item -> new InventoryReportResponse.SupplierPerformanceItem(
                        item.getName(), item.getProductCount(), item.getTotalValue()))
                .toList();

        List<InventoryReportResponse.DailyMovementItem> dailyMovements =
                aggregateDailyMovements(movementRepository.findByCreatedAtBetween(effectiveFrom, effectiveTo));

        return new InventoryReportResponse(
                productRepository.count(),
                categoryRepository.count(),
                supplierRepository.count(),
                productRepository.countLowStock(),
                productRepository.countOutOfStock(),
                productRepository.totalInventoryValue(),
                byCategory,
                dailyMovements,
                topProducts,
                suppliers);
    }

    private List<InventoryReportResponse.DailyMovementItem> aggregateDailyMovements(
            List<StockMovement> movements) {

        Map<LocalDate, long[]> daily = new LinkedHashMap<>();

        for (StockMovement movement : movements) {
            long[] inOut = daily.computeIfAbsent(
                    movement.getCreatedAt().toLocalDate(), key -> new long[]{0, 0});

            if (movement.getType() == MovementType.INBOUND) {
                inOut[0] += movement.getQuantity();
            } else {
                inOut[1] += movement.getQuantity();
            }
        }

        List<InventoryReportResponse.DailyMovementItem> result = new ArrayList<>();
        for (Map.Entry<LocalDate, long[]> entry : daily.entrySet()) {
            result.add(new InventoryReportResponse.DailyMovementItem(
                    entry.getKey().toString(), entry.getValue()[0], entry.getValue()[1]));
        }
        return result;
    }
}
