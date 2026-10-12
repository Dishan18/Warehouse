package com.dishan.warehouse.product.repository;

import com.dishan.warehouse.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository
        extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    /**
     * Acquires a pessimistic write lock (SELECT ... FOR UPDATE) on the product row.
     * Use this in any transaction that will mutate stock quantity to prevent
     * concurrent transactions from reading a stale quantity and causing negative inventory.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") UUID id);

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, UUID id);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.quantity > 0 AND p.quantity <= p.minStock")
    long countLowStock();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.quantity = 0")
    long countOutOfStock();

    @Query("SELECT p FROM Product p WHERE p.quantity <= p.minStock ORDER BY p.quantity ASC")
    List<Product> findLowStockProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.quantity <= p.minStock OR (:threshold >= 0 AND p.quantity <= :threshold) ORDER BY p.quantity ASC")
    List<Product> findProductsAtOrBelowThreshold(@Param("threshold") int threshold, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.quantity <= p.minStock OR (:threshold >= 0 AND p.quantity <= :threshold)")
    long countProductsAtOrBelowThreshold(@Param("threshold") int threshold);

    @Query("""
            SELECT c.name AS name, COUNT(p.id) AS productCount
            FROM Product p JOIN p.category c
            GROUP BY c.name
            ORDER BY productCount DESC
            """)
    List<CategoryCountProjection> countProductsByCategory();

    interface CategoryCountProjection {
        String getName();
        long getProductCount();
    }

    @Query("SELECT COALESCE(SUM(p.price * p.quantity), 0) FROM Product p")
    BigDecimal totalInventoryValue();

    @Query("""
            SELECT c.name AS name, COUNT(p.id) AS productCount,
                   COALESCE(SUM(p.price * p.quantity), 0) AS totalValue
            FROM Product p JOIN p.category c
            GROUP BY c.name
            ORDER BY productCount DESC
            """)
    List<CategoryBreakdown> categoryBreakdown();

    interface CategoryBreakdown {
        String getName();
        long getProductCount();
        BigDecimal getTotalValue();
    }

    @Query("""
            SELECT s.name AS name, COUNT(p.id) AS productCount,
                   COALESCE(SUM(p.price * p.quantity), 0) AS totalValue
            FROM Product p JOIN p.supplier s
            GROUP BY s.id, s.name
            ORDER BY totalValue DESC
            """)
    List<SupplierPerformance> supplierPerformance();

    interface SupplierPerformance {
        String getName();
        long getProductCount();
        BigDecimal getTotalValue();
    }

}
