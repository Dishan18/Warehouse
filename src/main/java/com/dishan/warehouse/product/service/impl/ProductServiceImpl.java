package com.dishan.warehouse.product.service.impl;

import com.dishan.warehouse.audit.AuditConstants;
import com.dishan.warehouse.audit.service.AuditLogService;
import com.dishan.warehouse.category.repository.CategoryRepository;
import com.dishan.warehouse.entity.Category;
import com.dishan.warehouse.entity.Product;
import com.dishan.warehouse.entity.Supplier;
import com.dishan.warehouse.exception.DuplicateResourceException;
import com.dishan.warehouse.exception.ResourceNotFoundException;
import com.dishan.warehouse.product.dto.ProductRequest;
import com.dishan.warehouse.product.dto.ProductResponse;
import com.dishan.warehouse.product.dto.ProductStatus;
import com.dishan.warehouse.product.mapper.ProductMapper;
import com.dishan.warehouse.product.repository.ProductRepository;
import com.dishan.warehouse.product.service.ProductService;
import com.dishan.warehouse.supplier.repository.SupplierRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    private final CategoryRepository categoryRepository;

    private final SupplierRepository supplierRepository;

    private final ProductMapper productMapper;

    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public ProductResponse create(ProductRequest request) {

        if (productRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("SKU already exists");
        }

        Product product = productMapper.toEntity(request);
        product.setCategory(findCategory(request.getCategoryId()));
        product.setSupplier(findSupplier(request.getSupplierId()));

        Product saved = productRepository.save(product);

        log.info("Product created: {} (sku={}, id={})", saved.getName(), saved.getSku(), saved.getId());

        auditLogService.record(AuditConstants.ACTION_CREATE, AuditConstants.ENTITY_PRODUCT,
                saved.getId(), "Created product \"" + saved.getName() + "\" (SKU: " + saved.getSku() + ")");

        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponse update(UUID id, ProductRequest request) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (productRepository.existsBySkuAndIdNot(request.getSku(), id)) {
            throw new DuplicateResourceException("SKU already exists");
        }

        product.setName(request.getName());
        product.setSku(request.getSku());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        product.setMinStock(request.getMinStock());
        product.setActive(request.getActive());
        product.setCategory(findCategory(request.getCategoryId()));
        product.setSupplier(findSupplier(request.getSupplierId()));

        Product saved = productRepository.save(product);

        log.info("Product updated: {} (id={})", saved.getName(), saved.getId());

        auditLogService.record(AuditConstants.ACTION_UPDATE, AuditConstants.ENTITY_PRODUCT,
                saved.getId(), "Updated product \"" + saved.getName() + "\" (SKU: " + saved.getSku() + ")");

        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getById(UUID id) {

        return productRepository.findById(id)
                .map(productMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAll(String search, UUID categoryId, ProductStatus status,
                                        Boolean active, Pageable pageable) {

        return productRepository
                .findAll(buildSpecification(search, categoryId, status, active), pageable)
                .map(productMapper::toResponse);
    }

    @Override
    @Transactional
    public void delete(UUID id) {

        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found");
        }

        productRepository.deleteById(id);

        log.info("Product deleted: {}", id);

        auditLogService.record(AuditConstants.ACTION_DELETE, AuditConstants.ENTITY_PRODUCT,
                id, "Deleted product " + id);
    }

    private Category findCategory(UUID categoryId) {

        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    private Supplier findSupplier(UUID supplierId) {

        if (supplierId == null) {
            return null;
        }

        return supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
    }

    private Specification<Product> buildSpecification(
            String search, UUID categoryId, ProductStatus status, Boolean active) {

        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("sku")), pattern)
                ));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (status != null) {
                switch (status) {
                    case LOW_STOCK -> predicates.add(cb.and(
                            cb.greaterThan(root.get("quantity"), 0),
                            cb.lessThanOrEqualTo(root.get("quantity"), root.get("minStock"))
                    ));
                    case OUT_OF_STOCK -> predicates.add(cb.equal(root.get("quantity"), 0));
                    case IN_STOCK -> predicates.add(
                            cb.greaterThan(root.get("quantity"), root.get("minStock"))
                    );
                }
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

}
