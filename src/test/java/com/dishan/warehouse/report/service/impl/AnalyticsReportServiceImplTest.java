package com.dishan.warehouse.report.service.impl;

import com.dishan.warehouse.category.repository.CategoryRepository;
import com.dishan.warehouse.entity.MovementType;
import com.dishan.warehouse.entity.StockMovement;
import com.dishan.warehouse.movement.repository.StockMovementRepository;
import com.dishan.warehouse.product.repository.ProductRepository;
import com.dishan.warehouse.report.dto.InventoryReportResponse;
import com.dishan.warehouse.supplier.repository.SupplierRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsReportServiceImplTest {

    private static final LocalDateTime FROM = LocalDateTime.of(2026, 1, 1, 0, 0);

    private static final LocalDateTime TO = LocalDateTime.of(2026, 1, 31, 23, 59);

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private StockMovementRepository movementRepository;

    @InjectMocks
    private AnalyticsReportServiceImpl reportService;

    @Test
    void generateInventoryReport_mapsAllAggregates() {
        ProductRepository.CategoryBreakdown electronics =
                categoryBreakdown("Electronics", 10L, "1000.00");
        ProductRepository.CategoryBreakdown furniture =
                categoryBreakdown("Furniture", 4L, "250.00");
        ProductRepository.SupplierPerformance acme =
                mock(ProductRepository.SupplierPerformance.class);
        when(acme.getName()).thenReturn("Acme");
        when(acme.getProductCount()).thenReturn(6L);
        when(acme.getTotalValue()).thenReturn(new BigDecimal("700.00"));
        StockMovementRepository.TopProductProjection led =
                mock(StockMovementRepository.TopProductProjection.class);
        when(led.getName()).thenReturn("LED Red");
        when(led.getMovementCount()).thenReturn(12L);

        when(productRepository.categoryBreakdown()).thenReturn(List.of(electronics, furniture));
        when(movementRepository.findTopProductsByMovement(FROM, TO, org.springframework.data.domain.PageRequest.of(0, 5)))
                .thenReturn(List.of(led));
        when(productRepository.supplierPerformance()).thenReturn(List.of(acme));
        when(movementRepository.findByCreatedAtBetween(FROM, TO)).thenReturn(List.of());
        when(productRepository.count()).thenReturn(50L);
        when(categoryRepository.count()).thenReturn(5L);
        when(supplierRepository.count()).thenReturn(3L);
        when(productRepository.countLowStock()).thenReturn(2L);
        when(productRepository.countOutOfStock()).thenReturn(1L);
        when(productRepository.totalInventoryValue()).thenReturn(new BigDecimal("5000.00"));

        InventoryReportResponse response = reportService.generateInventoryReport(FROM, TO);

        assertEquals(50L, response.totalProducts());
        assertEquals(5L, response.totalCategories());
        assertEquals(3L, response.totalSuppliers());
        assertEquals(2L, response.lowStockProducts());
        assertEquals(1L, response.outOfStockProducts());
        assertEquals(new BigDecimal("5000.00"), response.totalInventoryValue());

        assertEquals(2, response.productsByCategory().size());
        assertEquals("Electronics", response.productsByCategory().get(0).category());
        assertEquals(10L, response.productsByCategory().get(0).count());
        assertEquals(new BigDecimal("1000.00"), response.productsByCategory().get(0).value());
        assertEquals("Furniture", response.productsByCategory().get(1).category());

        assertEquals(1, response.topProductsByMovement().size());
        assertEquals("LED Red", response.topProductsByMovement().get(0).product());
        assertEquals(12L, response.topProductsByMovement().get(0).movements());

        assertEquals(1, response.supplierPerformance().size());
        assertEquals("Acme", response.supplierPerformance().get(0).supplier());
        assertEquals(6L, response.supplierPerformance().get(0).products());
        assertEquals(new BigDecimal("700.00"), response.supplierPerformance().get(0).totalValue());

        assertTrue(response.stockMovements().isEmpty());
    }

    @Test
    void generateInventoryReport_withNullDates_appliesDefaults() {
        when(productRepository.categoryBreakdown()).thenReturn(List.of());
        when(movementRepository.findTopProductsByMovement(any(), any(), any(Pageable.class)))
                .thenReturn(List.of());
        when(productRepository.supplierPerformance()).thenReturn(List.of());
        when(movementRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of());

        reportService.generateInventoryReport(null, null);

        ArgumentCaptor<LocalDateTime> fromCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> toCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(movementRepository).findByCreatedAtBetween(fromCaptor.capture(), toCaptor.capture());
        assertNotNull(fromCaptor.getValue());
        assertNotNull(toCaptor.getValue());

        ArgumentCaptor<Pageable> pageCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(movementRepository).findTopProductsByMovement(any(), any(), pageCaptor.capture());
        assertEquals(0, pageCaptor.getValue().getPageNumber());
        assertEquals(5, pageCaptor.getValue().getPageSize());
    }

    @Test
    void aggregateDailyMovements_groupsByDayAndType() {
        StockMovement inboundMorning = movement(MovementType.INBOUND, 5, LocalDateTime.of(2026, 1, 10, 9, 0));
        StockMovement inboundEvening = movement(MovementType.INBOUND, 3, LocalDateTime.of(2026, 1, 10, 18, 0));
        StockMovement outbound = movement(MovementType.OUTBOUND, 4, LocalDateTime.of(2026, 1, 10, 20, 0));
        StockMovement adjustment = movement(MovementType.ADJUSTMENT, 2, LocalDateTime.of(2026, 1, 11, 8, 0));

        when(productRepository.categoryBreakdown()).thenReturn(List.of());
        when(movementRepository.findTopProductsByMovement(any(), any(), any(Pageable.class)))
                .thenReturn(List.of());
        when(productRepository.supplierPerformance()).thenReturn(List.of());
        when(movementRepository.findByCreatedAtBetween(any(), any()))
                .thenReturn(List.of(inboundMorning, inboundEvening, outbound, adjustment));

        InventoryReportResponse response = reportService.generateInventoryReport(FROM, TO);

        assertEquals(2, response.stockMovements().size());

        InventoryReportResponse.DailyMovementItem firstDay = response.stockMovements().get(0);
        assertEquals(LocalDate.of(2026, 1, 10).toString(), firstDay.date());
        assertEquals(8L, firstDay.in());
        assertEquals(4L, firstDay.out());

        InventoryReportResponse.DailyMovementItem secondDay = response.stockMovements().get(1);
        assertEquals(LocalDate.of(2026, 1, 11).toString(), secondDay.date());
        assertEquals(0L, secondDay.in());
        assertEquals(2L, secondDay.out());
    }

    @Test
    void aggregateDailyMovements_emptyMovementsReturnsEmpty() {
        when(productRepository.categoryBreakdown()).thenReturn(List.of());
        when(movementRepository.findTopProductsByMovement(any(), any(), any(Pageable.class)))
                .thenReturn(List.of());
        when(productRepository.supplierPerformance()).thenReturn(List.of());
        when(movementRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of());

        InventoryReportResponse response = reportService.generateInventoryReport(FROM, TO);

        assertTrue(response.stockMovements().isEmpty());
    }

    private ProductRepository.CategoryBreakdown categoryBreakdown(
            String name, long productCount, String totalValue) {

        ProductRepository.CategoryBreakdown item = mock(ProductRepository.CategoryBreakdown.class);
        when(item.getName()).thenReturn(name);
        when(item.getProductCount()).thenReturn(productCount);
        when(item.getTotalValue()).thenReturn(new BigDecimal(totalValue));
        return item;
    }

    private StockMovement movement(MovementType type, int quantity, LocalDateTime createdAt) {

        return StockMovement.builder()
                .type(type)
                .quantity(quantity)
                .createdAt(createdAt)
                .build();
    }
}