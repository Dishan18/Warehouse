package com.dishan.warehouse.supplier.repository;

import com.dishan.warehouse.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    Optional<Supplier> findByName(String name);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, UUID id);

    Page<Supplier> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("""
            SELECT p.supplier.id AS supplierId, COUNT(p.id) AS productCount
            FROM Product p
            WHERE p.supplier IS NOT NULL
            GROUP BY p.supplier.id
            """)
    java.util.List<SupplierProductCount> countProductsBySupplier();

    interface SupplierProductCount {
        UUID getSupplierId();
        long getProductCount();
    }

}
