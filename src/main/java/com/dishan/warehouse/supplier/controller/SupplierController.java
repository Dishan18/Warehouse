package com.dishan.warehouse.supplier.controller;

import com.dishan.warehouse.supplier.dto.SupplierRequest;
import com.dishan.warehouse.supplier.dto.SupplierResponse;
import com.dishan.warehouse.supplier.service.SupplierService;
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
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @PostMapping
    public ResponseEntity<SupplierResponse> create(
            @Valid @RequestBody SupplierRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(supplierService.create(request));
    }

    @PutMapping("/{id}")
    public SupplierResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody SupplierRequest request) {

        return supplierService.update(id, request);
    }

    @GetMapping("/{id}")
    public SupplierResponse getById(@PathVariable UUID id) {

        return supplierService.getById(id);
    }

    @GetMapping
    public Page<SupplierResponse> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        return supplierService.getAll(search, createPageable(page, size, sortBy, direction));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {

        supplierService.delete(id);
    }

    private Pageable createPageable(int page, int size, String sortBy, String direction) {

        Sort.Direction sortDirection =
                "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;

        return PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
    }

}
