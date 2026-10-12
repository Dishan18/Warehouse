package com.dishan.warehouse.movement.service.impl;

import com.dishan.warehouse.audit.AuditConstants;
import com.dishan.warehouse.audit.service.AuditLogService;
import com.dishan.warehouse.entity.MovementType;
import com.dishan.warehouse.entity.Product;
import com.dishan.warehouse.entity.StockMovement;
import com.dishan.warehouse.exception.InsufficientStockException;
import com.dishan.warehouse.exception.ResourceNotFoundException;
import com.dishan.warehouse.idempotency.IdempotencyContext;
import com.dishan.warehouse.movement.dto.MovementRequest;
import com.dishan.warehouse.movement.dto.MovementResponse;
import com.dishan.warehouse.movement.mapper.MovementMapper;
import com.dishan.warehouse.movement.event.StockLevelChangedEvent;
import com.dishan.warehouse.movement.repository.StockMovementRepository;
import com.dishan.warehouse.movement.service.MovementService;
import com.dishan.warehouse.product.repository.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovementServiceImpl implements MovementService {

    private final ProductRepository productRepository;

    private final StockMovementRepository movementRepository;

    private final MovementMapper movementMapper;

    private final AuditLogService auditLogService;

    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public MovementResponse inbound(MovementRequest request, String username) {
        MovementResponse replayed = checkCommittedIdempotentMovement();
        if (replayed != null) {
            return replayed;
        }

        requirePositiveQuantity(request.getQuantity());
        // PESSIMISTIC_WRITE lock: ensures concurrent inbound updates serialize and prevent lost updates
        Product product = findProductForUpdate(request.getProductId());

        // Re-check under pessimistic product lock to catch any concurrent worker that committed while we waited for lock
        replayed = checkCommittedIdempotentMovement();
        if (replayed != null) {
            return replayed;
        }

        int before = product.getQuantity();
        int after = before + request.getQuantity();

        return register(product, MovementType.INBOUND, request.getQuantity(),
                before, after, request.getReason(), username);
    }

    @Override
    @Transactional
    public MovementResponse outbound(MovementRequest request, String username) {
        MovementResponse replayed = checkCommittedIdempotentMovement();
        if (replayed != null) {
            return replayed;
        }

        requirePositiveQuantity(request.getQuantity());
        // PESSIMISTIC_WRITE lock: blocks concurrent transactions from reading a stale
        // quantity for this product until this transaction commits, preventing negative stock.
        Product product = findProductForUpdate(request.getProductId());

        // Re-check under pessimistic product lock to catch any concurrent worker that committed while we waited for lock
        replayed = checkCommittedIdempotentMovement();
        if (replayed != null) {
            return replayed;
        }

        int before = product.getQuantity();

        if (request.getQuantity() > before) {
            throw new InsufficientStockException(
                    "Insufficient stock: only " + before + " units available for " + product.getSku());
        }

        int after = before - request.getQuantity();

        return register(product, MovementType.OUTBOUND, request.getQuantity(),
                before, after, request.getReason(), username);
    }

    @Override
    @Transactional
    public MovementResponse adjust(MovementRequest request, String username) {
        MovementResponse replayed = checkCommittedIdempotentMovement();
        if (replayed != null) {
            return replayed;
        }

        // PESSIMISTIC_WRITE lock: ensures the before-quantity we snapshot is the
        // authoritative committed value, not a dirty read from a concurrent transaction.
        Product product = findProductForUpdate(request.getProductId());

        // Re-check under pessimistic product lock to catch any concurrent worker that committed while we waited for lock
        replayed = checkCommittedIdempotentMovement();
        if (replayed != null) {
            return replayed;
        }

        int newTotal = request.getQuantity();
        int before = product.getQuantity();

        return register(product, MovementType.ADJUSTMENT, newTotal,
                before, newTotal, request.getReason(), username);
    }

    private MovementResponse checkCommittedIdempotentMovement() {
        IdempotencyContext.Scope scope = IdempotencyContext.get();
        if (scope != null && scope.recordId() != null) {
            return movementRepository.findByIdempotencyRecordId(scope.recordId())
                    .map(committed -> {
                        log.info("Idempotent replay: found committed movement for recordId '{}' (key '{}'), returning without re-executing stock mutation",
                                scope.recordId(), scope.key());
                        return movementMapper.toResponse(committed);
                    })
                    .orElse(null);
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MovementResponse> getAll(String search, MovementType type, UUID productId,
                                         LocalDateTime from, LocalDateTime to, Pageable pageable) {

        return movementRepository
                .findAll(buildSpecification(search, type, productId, from, to), pageable)
                .map(movementMapper::toResponse);
    }

    private MovementResponse register(Product product, MovementType type, int quantity,
                                      int before, int after, String reason, String username) {

        product.setQuantity(after);
        productRepository.save(product);

        IdempotencyContext.Scope scope = IdempotencyContext.get();
        UUID idempotencyRecordId = (scope != null) ? scope.recordId() : null;
        String idempotencyKey = (scope != null) ? scope.key() : null;

        StockMovement movement = StockMovement.builder()
                .product(product)
                .type(type)
                .quantity(quantity)
                .beforeQuantity(before)
                .afterQuantity(after)
                .reason(reason)
                .performedBy(username)
                .idempotencyRecordId(idempotencyRecordId)
                .idempotencyKey(idempotencyKey)
                .build();

        StockMovement saved = movementRepository.save(movement);

        log.info("Stock {} for {} ({}): {} -> {} by {}", type, product.getSku(),
                saved.getId(), before, after, username);

        auditLogService.record(type.name(), AuditConstants.ENTITY_STOCK_MOVEMENT,
                saved.getId(), String.format(
                        "%s %d units of \"%s\" (%s): %d -> %d",
                        type, quantity, product.getName(), product.getSku(), before, after));

        eventPublisher.publishEvent(new StockLevelChangedEvent(
                product.getId(),
                product.getName(),
                product.getSku(),
                after,
                product.getMinStock()
        ));

        return movementMapper.toResponse(saved);
    }

    private Product findProductForUpdate(UUID productId) {

        return productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private void requirePositiveQuantity(Integer quantity) {

        if (quantity == null || quantity < 1) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }
    }

    private Specification<StockMovement> buildSpecification(
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
