package com.dishan.warehouse.product.controller;

import com.dishan.warehouse.product.dto.ProductRequest;
import com.dishan.warehouse.product.dto.ProductResponse;
import com.dishan.warehouse.product.dto.ProductStatus;
import com.dishan.warehouse.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ProductResponse> create(
            @Valid @RequestBody ProductRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(productService.create(request));
    }

    @PutMapping("/{id}")
    public ProductResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody ProductRequest request) {

        return productService.update(id, request);
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable UUID id) {

        return productService.getById(id);
    }

    @GetMapping
    public Page<ProductResponse> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        return productService.getAll(
                search, categoryId, status, active, createPageable(page, size, sortBy, direction));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {

        productService.delete(id);
    }

    private Pageable createPageable(int page, int size, String sortBy, String direction) {

        Sort.Direction sortDirection =
                "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;

        return PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
    }

}
