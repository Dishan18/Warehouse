package com.dishan.warehouse.category.controller;

import com.dishan.warehouse.category.dto.CategoryRequest;
import com.dishan.warehouse.category.dto.CategoryResponse;
import com.dishan.warehouse.category.service.CategoryService;
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
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponse> create(
            @Valid @RequestBody CategoryRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(categoryService.create(request));
    }

    @PutMapping("/{id}")
    public CategoryResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequest request) {

        return categoryService.update(id, request);
    }

    @GetMapping("/{id}")
    public CategoryResponse getById(@PathVariable UUID id) {

        return categoryService.getById(id);
    }

    @GetMapping
    public Page<CategoryResponse> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        return categoryService.getAll(search, createPageable(page, size, sortBy, direction));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {

        categoryService.delete(id);
    }

    private Pageable createPageable(int page, int size, String sortBy, String direction) {

        Sort.Direction sortDirection =
                "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;

        return PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
    }

}
