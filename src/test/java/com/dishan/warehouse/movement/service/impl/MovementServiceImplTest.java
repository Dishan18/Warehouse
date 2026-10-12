package com.dishan.warehouse.movement.service.impl;

import com.dishan.warehouse.audit.service.AuditLogService;
import com.dishan.warehouse.entity.MovementType;
import com.dishan.warehouse.entity.Product;
import com.dishan.warehouse.entity.StockMovement;
import com.dishan.warehouse.exception.InsufficientStockException;
import com.dishan.warehouse.exception.ResourceNotFoundException;
import com.dishan.warehouse.movement.dto.MovementRequest;
import com.dishan.warehouse.movement.dto.MovementResponse;
import com.dishan.warehouse.movement.mapper.MovementMapper;
import com.dishan.warehouse.movement.repository.StockMovementRepository;
import com.dishan.warehouse.product.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import com.dishan.warehouse.idempotency.IdempotencyContext;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MovementServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockMovementRepository movementRepository;

    @Mock
    private MovementMapper movementMapper;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private MovementServiceImpl movementService;

    private Product product;

    private MovementRequest request;

    @BeforeEach
    void setUp() {
        product = Product.builder()
                .id(UUID.randomUUID())
                .name("LED Red")
                .sku("LED-RED-001")
                .price(BigDecimal.TEN)
                .quantity(10)
                .minStock(2)
                .active(true)
                .build();

        request = new MovementRequest();
        request.setProductId(product.getId());
        request.setQuantity(5);
        request.setReason("Test movement");
    }

    @Test
    void inbound_increasesQuantityAndRecordsBeforeAfter() {
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));
        when(movementRepository.save(any(StockMovement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(movementMapper.toResponse(any(StockMovement.class))).thenReturn(MovementResponse.builder().build());

        movementService.inbound(request, "admin@test.com");

        ArgumentCaptor<StockMovement> captor = ArgumentCaptor.forClass(StockMovement.class);
        verify(movementRepository).save(captor.capture());

        StockMovement movement = captor.getValue();
        assertEquals(MovementType.INBOUND, movement.getType());
        assertEquals(5, movement.getQuantity());
        assertEquals(10, movement.getBeforeQuantity());
        assertEquals(15, movement.getAfterQuantity());
        assertEquals(15, product.getQuantity());
        assertEquals("admin@test.com", movement.getPerformedBy());

        verify(eventPublisher).publishEvent(any(com.dishan.warehouse.movement.event.StockLevelChangedEvent.class));
    }

    @Test
    void outbound_decreasesQuantityAndUsesPessimisticLock() {
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));
        when(movementRepository.save(any(StockMovement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(movementMapper.toResponse(any(StockMovement.class))).thenReturn(MovementResponse.builder().build());

        movementService.outbound(request, "admin@test.com");

        ArgumentCaptor<StockMovement> captor = ArgumentCaptor.forClass(StockMovement.class);
        verify(movementRepository).save(captor.capture());

        assertEquals(MovementType.OUTBOUND, captor.getValue().getType());
        assertEquals(10, captor.getValue().getBeforeQuantity());
        assertEquals(5, captor.getValue().getAfterQuantity());
        assertEquals(5, product.getQuantity());

        verify(productRepository).findByIdForUpdate(product.getId());
        verify(eventPublisher).publishEvent(any(com.dishan.warehouse.movement.event.StockLevelChangedEvent.class));
    }

    @Test
    void outbound_throwsWhenInsufficientStock() {
        request.setQuantity(50);
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));

        assertThrows(InsufficientStockException.class, () -> movementService.outbound(request, "admin@test.com"));
    }

    @Test
    void adjust_setsNewTotalAndUsesPessimisticLock() {
        request.setQuantity(42);
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));
        when(movementRepository.save(any(StockMovement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(movementMapper.toResponse(any(StockMovement.class))).thenReturn(MovementResponse.builder().build());

        movementService.adjust(request, "admin@test.com");

        ArgumentCaptor<StockMovement> captor = ArgumentCaptor.forClass(StockMovement.class);
        verify(movementRepository).save(captor.capture());

        StockMovement movement = captor.getValue();
        assertEquals(MovementType.ADJUSTMENT, movement.getType());
        assertEquals(10, movement.getBeforeQuantity());
        assertEquals(42, movement.getAfterQuantity());
        assertEquals(42, product.getQuantity());

        verify(productRepository).findByIdForUpdate(product.getId());
    }

    @Test
    void inbound_rejectsZeroQuantity() {
        request.setQuantity(0);

        assertThrows(IllegalArgumentException.class, () -> movementService.inbound(request, "admin@test.com"));
    }

    @Test
    void outbound_throwsWhenProductNotFound() {
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> movementService.outbound(request, "admin@test.com"));
    }

    @Test
    void outbound_whenIdempotencyRecordAlreadyCommitted_replaysWithoutMutatingStock() {
        UUID recordId = UUID.randomUUID();
        String idempotencyKey = "idem-replay-key";
        IdempotencyContext.set(recordId, "admin", "POST", "/api/movements/outbound", idempotencyKey);

        try {
            StockMovement committedMovement = StockMovement.builder()
                    .id(UUID.randomUUID())
                    .product(product)
                    .type(MovementType.OUTBOUND)
                    .quantity(5)
                    .beforeQuantity(10)
                    .afterQuantity(5)
                    .performedBy("admin@test.com")
                    .idempotencyRecordId(recordId)
                    .idempotencyKey(idempotencyKey)
                    .build();

            MovementResponse expectedResponse = MovementResponse.builder()
                    .id(committedMovement.getId())
                    .productId(product.getId())
                    .type(MovementType.OUTBOUND)
                    .quantity(5)
                    .beforeQuantity(10)
                    .afterQuantity(5)
                    .build();

            when(movementRepository.findByIdempotencyRecordId(recordId)).thenReturn(Optional.of(committedMovement));
            when(movementMapper.toResponse(committedMovement)).thenReturn(expectedResponse);

            MovementResponse response = movementService.outbound(request, "admin@test.com");

            assertNotNull(response);
            assertEquals(expectedResponse.getId(), response.getId());
            // Product lock and update should NEVER be called on replay
            verify(productRepository, never()).findByIdForUpdate(any());
            verify(productRepository, never()).save(any());
            verify(movementRepository, never()).save(any());
        } finally {
            IdempotencyContext.clear();
        }
    }

    @Test
    void outbound_whenConcurrentWorkerCommittedWhileWaitingForProductLock_replaysUnderLockWithoutDoubleDeduction() {
        UUID recordId = UUID.randomUUID();
        String idempotencyKey = "race-key";
        IdempotencyContext.set(recordId, "admin", "POST", "/api/movements/outbound", idempotencyKey);

        try {
            StockMovement committedMovement = StockMovement.builder()
                    .id(UUID.randomUUID())
                    .product(product)
                    .type(MovementType.OUTBOUND)
                    .quantity(5)
                    .beforeQuantity(10)
                    .afterQuantity(5)
                    .performedBy("admin@test.com")
                    .idempotencyRecordId(recordId)
                    .idempotencyKey(idempotencyKey)
                    .build();

            MovementResponse expectedResponse = MovementResponse.builder()
                    .id(committedMovement.getId())
                    .productId(product.getId())
                    .type(MovementType.OUTBOUND)
                    .quantity(5)
                    .beforeQuantity(10)
                    .afterQuantity(5)
                    .build();

            // First lookup (before lock) returns empty (other worker still running)
            // Second lookup (after lock) returns committed movement (other worker committed and released lock)
            when(movementRepository.findByIdempotencyRecordId(recordId))
                    .thenReturn(Optional.empty())
                    .thenReturn(Optional.of(committedMovement));

            when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));
            when(movementMapper.toResponse(committedMovement)).thenReturn(expectedResponse);

            MovementResponse response = movementService.outbound(request, "admin@test.com");

            assertNotNull(response);
            assertEquals(expectedResponse.getId(), response.getId());
            // Product lock WAS acquired, but no update or save occurred because of re-check under lock
            verify(productRepository).findByIdForUpdate(product.getId());
            verify(productRepository, never()).save(any());
            verify(movementRepository, never()).save(any());
            verify(movementRepository, never()).saveAndFlush(any());
            // Product quantity remains 10 (untouched)
            assertEquals(10, product.getQuantity());
        } finally {
            IdempotencyContext.clear();
        }
    }

    @Test
    void inbound_withIdempotencyContext_persistsIdempotencyRecordIdAndKeyOnStockMovement() {
        UUID recordId = UUID.randomUUID();
        String idempotencyKey = "idem-inbound-key";
        IdempotencyContext.set(recordId, "admin", "POST", "/api/movements/inbound", idempotencyKey);

        try {
            when(movementRepository.findByIdempotencyRecordId(recordId)).thenReturn(Optional.empty());
            when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));
            when(movementRepository.save(any(StockMovement.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(movementMapper.toResponse(any(StockMovement.class))).thenReturn(MovementResponse.builder().build());

            movementService.inbound(request, "admin@test.com");

            ArgumentCaptor<StockMovement> captor = ArgumentCaptor.forClass(StockMovement.class);
            verify(movementRepository).save(captor.capture());

            StockMovement savedMovement = captor.getValue();
            assertEquals(recordId, savedMovement.getIdempotencyRecordId());
            assertEquals(idempotencyKey, savedMovement.getIdempotencyKey());
        } finally {
            IdempotencyContext.clear();
        }
    }
}
