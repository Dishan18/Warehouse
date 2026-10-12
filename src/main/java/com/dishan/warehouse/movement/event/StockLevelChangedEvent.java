package com.dishan.warehouse.movement.event;

import java.util.UUID;

/**
 * Published after a stock movement is persisted (still inside the transaction).
 * The StockAlertEventListener picks this up AFTER_COMMIT and pushes a WebSocket
 * alert if the product is at or below the configured low-stock threshold.
 */
public record StockLevelChangedEvent(
        UUID productId,
        String productName,
        String sku,
        int afterQuantity,
        int minStock
) {}
