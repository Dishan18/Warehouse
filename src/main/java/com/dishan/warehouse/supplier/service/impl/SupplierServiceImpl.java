package com.dishan.warehouse.supplier.service.impl;

import com.dishan.warehouse.audit.AuditConstants;
import com.dishan.warehouse.audit.service.AuditLogService;
import com.dishan.warehouse.entity.Supplier;
import com.dishan.warehouse.exception.DuplicateResourceException;
import com.dishan.warehouse.exception.ResourceNotFoundException;
import com.dishan.warehouse.supplier.dto.SupplierRequest;
import com.dishan.warehouse.supplier.dto.SupplierResponse;
import com.dishan.warehouse.supplier.mapper.SupplierMapper;
import com.dishan.warehouse.supplier.repository.SupplierRepository;
import com.dishan.warehouse.supplier.service.SupplierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;

    private final SupplierMapper supplierMapper;

    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public SupplierResponse create(SupplierRequest request) {

        if (supplierRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Supplier name already exists");
        }

        Supplier supplier = supplierRepository.save(supplierMapper.toEntity(request));

        log.info("Supplier created: {} ({})", supplier.getName(), supplier.getId());

        auditLogService.record(AuditConstants.ACTION_CREATE, AuditConstants.ENTITY_SUPPLIER,
                supplier.getId(), "Created supplier \"" + supplier.getName() + "\"");

        return toResponse(supplier, 0);
    }

    @Override
    @Transactional
    public SupplierResponse update(UUID id, SupplierRequest request) {

        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));

        if (supplierRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new DuplicateResourceException("Supplier name already exists");
        }

        supplier.setName(request.getName());
        supplier.setContactName(request.getContactName());
        supplier.setEmail(request.getEmail());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());
        supplier.setActive(request.getActive());

        log.info("Supplier updated: {} ({})", supplier.getName(), supplier.getId());

        Supplier saved = supplierRepository.save(supplier);

        auditLogService.record(AuditConstants.ACTION_UPDATE, AuditConstants.ENTITY_SUPPLIER,
                saved.getId(), "Updated supplier \"" + saved.getName() + "\"");

        return toResponse(saved, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse getById(UUID id) {

        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));

        return toResponse(supplier, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SupplierResponse> getAll(String search, Pageable pageable) {

        Page<Supplier> suppliers = (search != null && !search.isBlank())
                ? supplierRepository.findByNameContainingIgnoreCase(search.trim(), pageable)
                : supplierRepository.findAll(pageable);

        Map<UUID, Long> productCounts = supplierRepository
                .countProductsBySupplier()
                .stream()
                .collect(Collectors.toMap(
                        com.dishan.warehouse.supplier.repository.SupplierRepository.SupplierProductCount::getSupplierId,
                        com.dishan.warehouse.supplier.repository.SupplierRepository.SupplierProductCount::getProductCount
                ));

        return suppliers.map(supplier ->
                toResponse(supplier, productCounts.getOrDefault(supplier.getId(), 0L)));
    }

    @Override
    @Transactional
    public void delete(UUID id) {

        if (!supplierRepository.existsById(id)) {
            throw new ResourceNotFoundException("Supplier not found");
        }

        supplierRepository.deleteById(id);

        log.info("Supplier deleted: {}", id);

        auditLogService.record(AuditConstants.ACTION_DELETE, AuditConstants.ENTITY_SUPPLIER,
                id, "Deleted supplier " + id);
    }

    private SupplierResponse toResponse(Supplier supplier, long productCount) {

        SupplierResponse response = supplierMapper.toResponse(supplier);
        response.setProductCount(productCount);

        return response;
    }

}
