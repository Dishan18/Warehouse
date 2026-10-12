package com.dishan.warehouse.category.repository;


import com.dishan.warehouse.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findByName(String name);

    boolean existsByName(String name);

    Page<Category> findByNameContainingIgnoreCase(String name, Pageable pageable);

}