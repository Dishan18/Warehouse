package com.dishan.warehouse.report.service.impl;

import com.dishan.warehouse.entity.MovementType;
import com.dishan.warehouse.entity.Product;
import com.dishan.warehouse.entity.StockMovement;
import com.dishan.warehouse.movement.repository.StockMovementRepository;
import com.dishan.warehouse.product.dto.ProductStatus;
import com.dishan.warehouse.product.mapper.ProductMapper;
import com.dishan.warehouse.product.repository.ProductRepository;
import com.dishan.warehouse.report.service.CsvReportService;
import com.dishan.warehouse.report.util.CsvUtil;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CsvReportServiceImpl implements CsvReportService {

    private final ProductRepository productRepository;

    private final StockMovementRepository movementRepository;

    @Override
    @Transactional(readOnly = true)
    public String exportProducts(String search, UUID categoryId, ProductStatus status) {

        List<Product> products = productRepository.findAll(
                productSpecification(search, categoryId, status),
                Sort.by("name")
        );

        StringBuilder csv = new StringBuilder(
                CsvUtil.join(new String[]{"Name", "SKU", "Category", "Supplier",
                        "Price", "Quantity", "Min Stock", "Status", "Active"})
        );

        for (Product product : products) {
            csv.append(CsvUtil.join(new String[]{
                    product.getName(),
                    product.getSku(),
                    product.getCategory() != null ? product.getCategory().getName() : "",
                    product.getSupplier() != null ? product.getSupplier().getName() : "",
                    product.getPrice().toPlainString(),
                    String.valueOf(product.getQuantity()),
                    String.valueOf(product.getMinStock()),
                    statusLabel(product),
                    product.getActive() != null && product.getActive() ? "Yes" : "No"
            }));
        }

        return csv.toString();
    }

    @Override
    @Transactional(readOnly = true)
    public String exportMovements(String search, MovementType type, UUID productId,
                                  LocalDateTime from, LocalDateTime to) {

        List<StockMovement> movements = movementRepository.findAll(
                movementSpecification(search, type, productId, from, to),
                Sort.by("createdAt")
        );

        StringBuilder csv = new StringBuilder(
                CsvUtil.join(new String[]{"Date", "Type", "Product", "SKU",
                        "Quantity", "Before", "After", "Reason", "Performed By"})
        );

        for (StockMovement movement : movements) {
            csv.append(CsvUtil.join(new String[]{
                    String.valueOf(movement.getCreatedAt()),
                    movement.getType().name(),
                    movement.getProduct().getName(),
                    movement.getProduct().getSku(),
                    String.valueOf(movement.getQuantity()),
                    String.valueOf(movement.getBeforeQuantity()),
                    String.valueOf(movement.getAfterQuantity()),
                    movement.getReason(),
                    movement.getPerformedBy()
            }));
        }

        return csv.toString();
    }

    @Override
    @Transactional(readOnly = true)
    public String exportInventory() {

        List<Product> products = productRepository.findAll(Sort.by("name"));

        StringBuilder csv = new StringBuilder(
                CsvUtil.join(new String[]{"Name", "SKU", "Category", "Supplier",
                        "Unit Price", "Quantity", "Min Stock", "Stock Value", "Status"})
        );

        for (Product product : products) {
            BigDecimal value = product.getPrice().multiply(BigDecimal.valueOf(product.getQuantity()));
            csv.append(CsvUtil.join(new String[]{
                    product.getName(),
                    product.getSku(),
                    product.getCategory() != null ? product.getCategory().getName() : "",
                    product.getSupplier() != null ? product.getSupplier().getName() : "",
                    product.getPrice().toPlainString(),
                    String.valueOf(product.getQuantity()),
                    String.valueOf(product.getMinStock()),
                    value.toPlainString(),
                    statusLabel(product)
            }));
        }

        return csv.toString();
    }

    private String statusLabel(Product product) {

        return switch (ProductMapper.resolveStatus(product)) {
            case IN_STOCK -> "In stock";
            case LOW_STOCK -> "Low stock";
            case OUT_OF_STOCK -> "Out of stock";
        };
    }

    private Specification<Product> productSpecification(
            String search, UUID categoryId, ProductStatus status) {

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

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Specification<StockMovement> movementSpecification(
            String search, MovementType type, UUID productId,
            LocalDateTime from, LocalDateTime to) {

        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("product").get("name")), pattern),
                        cb.like(cb.lower(root.get("product").get("sku")), pattern)
                ));
            }

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            if (productId != null) {
                predicates.add(cb.equal(root.get("product").get("id"), productId));
            }

            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }

            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

}
