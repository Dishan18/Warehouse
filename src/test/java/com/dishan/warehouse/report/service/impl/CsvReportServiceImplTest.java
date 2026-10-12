package com.dishan.warehouse.report.service.impl;

import com.dishan.warehouse.entity.Category;
import com.dishan.warehouse.entity.MovementType;
import com.dishan.warehouse.entity.Product;
import com.dishan.warehouse.entity.StockMovement;
import com.dishan.warehouse.entity.Supplier;
import com.dishan.warehouse.movement.repository.StockMovementRepository;
import com.dishan.warehouse.product.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CsvReportServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockMovementRepository movementRepository;

    @InjectMocks
    private CsvReportServiceImpl csvReportService;

    private Product lowStockProduct;

    private Category category;

    private Supplier supplier;

    @BeforeEach
    void setUp() {
        category = new Category();
        category.setName("Electronics");

        supplier = new Supplier();
        supplier.setName("Acme");

        lowStockProduct = Product.builder()
                .id(UUID.randomUUID())
                .name("LED Red")
                .sku("LED-001")
                .price(new BigDecimal("10"))
                .quantity(5)
                .minStock(10)
                .category(category)
                .supplier(supplier)
                .active(true)
                .build();
    }

    @Test
    void exportProducts_writesHeaderAndRows() {
        when(productRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(lowStockProduct));

        String csv = csvReportService.exportProducts("led", null, null);

        assertTrue(csv.contains(
                "Name,SKU,Category,Supplier,Price,Quantity,Min Stock,Status,Active\n"));
        assertTrue(csv.contains("LED Red,LED-001,Electronics,Acme,10,5,10,Low stock,Yes\n"));
    }

    @Test
    void exportProducts_outOfStockStatus() {
        Product outOfStock = Product.builder()
                .name("Outed")
                .sku("OUT-001")
                .price(new BigDecimal("4"))
                .quantity(0)
                .minStock(2)
                .active(true)
                .build();
        when(productRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(outOfStock));

        String csv = csvReportService.exportProducts(null, null, null);

        assertTrue(csv.contains("Outed,OUT-001,,,4,0,2,Out of stock,Yes\n"));
    }

    @Test
    void exportProducts_escapesCommasAndQuotes() {
        Product tricky = Product.builder()
                .name("Acme, \"Special\"")
                .sku("TRICKY")
                .price(new BigDecimal("1"))
                .quantity(3)
                .minStock(1)
                .active(true)
                .build();
        when(productRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(tricky));

        String csv = csvReportService.exportProducts(null, null, null);

        assertTrue(csv.contains("\"Acme, \"\"Special\"\"\",TRICKY,,,1,3,1,In stock,Yes\n"));
    }

    @Test
    void exportMovements_writesHeaderAndRows() {
        StockMovement movement = movement();

        when(movementRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(movement));

        String csv = csvReportService.exportMovements(null, null, null, null, null);

        assertTrue(csv.contains(
                "Date,Type,Product,SKU,Quantity,Before,After,Reason,Performed By\n"));
        assertTrue(csv.contains(
                movement.getCreatedAt() + ",INBOUND,LED Red,LED-001,5,2,7,Restock,admin\n"));
    }

    @Test
    void exportInventory_writesStockValue() {
        when(productRepository.findAll(any(Sort.class))).thenReturn(List.of(lowStockProduct));

        String csv = csvReportService.exportInventory();

        assertTrue(csv.contains(
                "Name,SKU,Category,Supplier,Unit Price,Quantity,Min Stock,Stock Value,Status\n"));
        assertTrue(csv.contains("LED Red,LED-001,Electronics,Acme,10,5,10,50,Low stock\n"));
    }

    private StockMovement movement() {

        return StockMovement.builder()
                .type(MovementType.INBOUND)
                .quantity(5)
                .beforeQuantity(2)
                .afterQuantity(7)
                .reason("Restock")
                .performedBy("admin")
                .createdAt(LocalDateTime.of(2026, 1, 10, 9, 0))
                .product(lowStockProduct)
                .build();
    }
}