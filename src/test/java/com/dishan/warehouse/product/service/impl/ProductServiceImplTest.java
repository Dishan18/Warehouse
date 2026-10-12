package com.dishan.warehouse.product.service.impl;

import com.dishan.warehouse.audit.service.AuditLogService;
import com.dishan.warehouse.category.repository.CategoryRepository;
import com.dishan.warehouse.entity.Category;
import com.dishan.warehouse.entity.Product;
import com.dishan.warehouse.entity.Supplier;
import com.dishan.warehouse.exception.DuplicateResourceException;
import com.dishan.warehouse.exception.ResourceNotFoundException;
import com.dishan.warehouse.product.dto.ProductRequest;
import com.dishan.warehouse.product.dto.ProductResponse;
import com.dishan.warehouse.product.mapper.ProductMapper;
import com.dishan.warehouse.product.repository.ProductRepository;
import com.dishan.warehouse.supplier.repository.SupplierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ProductServiceImpl productService;

    private Category category;

    private Supplier supplier;

    private ProductRequest request;

    @BeforeEach
    void setUp() {
        category = new Category();
        category.setId(UUID.randomUUID());
        category.setName("Electronics");

        supplier = new Supplier();
        supplier.setId(UUID.randomUUID());
        supplier.setName("Acme");

        request = new ProductRequest();
        request.setName("LED Red");
        request.setSku("LED-RED-001");
        request.setPrice(BigDecimal.TEN);
        request.setQuantity(10);
        request.setMinStock(2);
        request.setCategoryId(category.getId());
        request.setSupplierId(supplier.getId());
        request.setActive(true);
    }

    @Test
    void create_setsCategoryAndSupplier() {
        Product product = Product.builder()
                .name(request.getName())
                .sku(request.getSku())
                .price(request.getPrice())
                .quantity(request.getQuantity())
                .minStock(request.getMinStock())
                .active(true)
                .build();
        Product saved = Product.builder()
                .id(UUID.randomUUID())
                .name(request.getName())
                .sku(request.getSku())
                .category(category)
                .supplier(supplier)
                .build();

        when(productRepository.existsBySku(request.getSku())).thenReturn(false);
        when(productMapper.toEntity(request)).thenReturn(product);
        when(categoryRepository.findById(request.getCategoryId())).thenReturn(Optional.of(category));
        when(supplierRepository.findById(request.getSupplierId())).thenReturn(Optional.of(supplier));
        when(productRepository.save(any(Product.class))).thenReturn(saved);
        when(productMapper.toResponse(saved)).thenReturn(ProductResponse.builder().build());

        ProductResponse response = productService.create(request);

        assertEquals(saved.getCategory(), product.getCategory());
        assertEquals(saved.getSupplier(), product.getSupplier());
        verify(productRepository).save(product);
    }

    @Test
    void create_throwsWhenSkuAlreadyExists() {
        when(productRepository.existsBySku(request.getSku())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> productService.create(request));
    }

    @Test
    void create_withoutSupplierLeavesSupplierNull() {
        request.setSupplierId(null);
        Product product = Product.builder().build();
        Product saved = Product.builder().id(UUID.randomUUID()).build();

        when(productRepository.existsBySku(request.getSku())).thenReturn(false);
        when(productMapper.toEntity(request)).thenReturn(product);
        when(categoryRepository.findById(request.getCategoryId())).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenReturn(saved);
        when(productMapper.toResponse(saved)).thenReturn(ProductResponse.builder().build());

        productService.create(request);

        assertNull(product.getSupplier());
    }

    @Test
    void create_throwsWhenCategoryNotFound() {
        when(productRepository.existsBySku(request.getSku())).thenReturn(false);
        when(productMapper.toEntity(request)).thenReturn(Product.builder().build());
        when(categoryRepository.findById(request.getCategoryId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.create(request));
    }

    @Test
    void update_updatesExistingProduct() {
        UUID id = UUID.randomUUID();
        Product existing = Product.builder()
                .id(id)
                .name("Old name")
                .sku("OLD-SKU")
                .price(BigDecimal.ONE)
                .quantity(1)
                .minStock(1)
                .active(true)
                .category(category)
                .build();

        when(productRepository.findById(id)).thenReturn(Optional.of(existing));
        when(productRepository.existsBySkuAndIdNot(request.getSku(), id)).thenReturn(false);
        when(categoryRepository.findById(request.getCategoryId())).thenReturn(Optional.of(category));
        when(supplierRepository.findById(request.getSupplierId())).thenReturn(Optional.of(supplier));
        when(productRepository.save(any(Product.class))).thenReturn(existing);
        when(productMapper.toResponse(existing)).thenReturn(ProductResponse.builder().build());

        productService.update(id, request);

        assertEquals(request.getName(), existing.getName());
        assertEquals(supplier, existing.getSupplier());
        verify(productRepository).save(existing);
    }

    @Test
    void update_throwsWhenProductNotFound() {
        UUID id = UUID.randomUUID();
        when(productRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.update(id, request));
    }

    @Test
    void delete_throwsWhenProductNotFound() {
        UUID id = UUID.randomUUID();
        when(productRepository.existsById(id)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> productService.delete(id));
    }
}
