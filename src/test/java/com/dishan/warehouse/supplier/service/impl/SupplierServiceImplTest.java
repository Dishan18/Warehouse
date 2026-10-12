package com.dishan.warehouse.supplier.service.impl;

import com.dishan.warehouse.audit.service.AuditLogService;
import com.dishan.warehouse.entity.Supplier;
import com.dishan.warehouse.exception.DuplicateResourceException;
import com.dishan.warehouse.exception.ResourceNotFoundException;
import com.dishan.warehouse.supplier.dto.SupplierRequest;
import com.dishan.warehouse.supplier.dto.SupplierResponse;
import com.dishan.warehouse.supplier.mapper.SupplierMapper;
import com.dishan.warehouse.supplier.repository.SupplierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupplierServiceImplTest {

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private SupplierMapper supplierMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private SupplierServiceImpl supplierService;

    private SupplierRequest request;

    @BeforeEach
    void setUp() {
        request = new SupplierRequest();
        request.setName("Acme Supplies");
        request.setContactName("John Doe");
        request.setEmail("john@acme.com");
        request.setActive(true);
    }

    @Test
    void create_savesSupplierAndReturnsZeroProductCount() {
        Supplier entity = new Supplier();
        Supplier saved = new Supplier();
        saved.setId(UUID.randomUUID());
        saved.setName(request.getName());

        when(supplierRepository.existsByName(request.getName())).thenReturn(false);
        when(supplierMapper.toEntity(request)).thenReturn(entity);
        when(supplierRepository.save(entity)).thenReturn(saved);
        SupplierResponse response = SupplierResponse.builder().build();
        when(supplierMapper.toResponse(saved)).thenReturn(response);

        SupplierResponse result = supplierService.create(request);

        assertEquals(0L, result.getProductCount());
        verify(supplierRepository).save(entity);
    }

    @Test
    void create_throwsWhenNameAlreadyExists() {
        when(supplierRepository.existsByName(request.getName())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> supplierService.create(request));
    }

    @Test
    void update_throwsWhenSupplierNotFound() {
        UUID id = UUID.randomUUID();
        when(supplierRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> supplierService.update(id, request));
    }

    @Test
    void delete_throwsWhenSupplierNotFound() {
        UUID id = UUID.randomUUID();
        when(supplierRepository.existsById(id)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> supplierService.delete(id));
    }

    @Test
    void getAll_setsProductCountFromRepository() {
        UUID id = UUID.randomUUID();
        Supplier supplier = new Supplier();
        supplier.setId(id);
        supplier.setName("Acme Supplies");

        when(supplierMapper.toResponse(supplier)).thenReturn(SupplierResponse.builder().build());

        org.springframework.data.domain.Page<Supplier> page =
                new org.springframework.data.domain.PageImpl<>(List.of(supplier));

        SupplierRepository.SupplierProductCount count =
                new SupplierRepository.SupplierProductCount() {
                    @Override
                    public UUID getSupplierId() {
                        return id;
                    }

                    @Override
                    public long getProductCount() {
                        return 3L;
                    }
                };

        when(supplierRepository.findAll(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);
        when(supplierRepository.countProductsBySupplier()).thenReturn(List.of(count));

        var result = supplierService.getAll(null, org.springframework.data.domain.Pageable.unpaged());

        SupplierResponse first = result.getContent().get(0);
        assertEquals(3L, first.getProductCount());
    }
}
