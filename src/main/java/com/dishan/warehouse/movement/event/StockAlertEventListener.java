package com.dishan.warehouse.movement.event;

import com.dishan.warehouse.notification.dto.StockAlertResponse;
import com.dishan.warehouse.settings.repository.AppSettingsRepository;
import com.dishan.warehouse.entity.AppSettings;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;

/**
 * Listens for StockLevelChangedEvent and dispatches a WebSocket alert AFTER the
 * inventory transaction has committed. Using AFTER_COMMIT guarantees that the
 * alert is only sent when the stock change is durable - never on a rollback.
 *
 * The @Async annotation moves the WebSocket dispatch off the caller's thread so
 * the HTTP response returns to the client immediately after commit.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StockAlertEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final AppSettingsRepository settingsRepository;

    @Async("stockAlertExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStockChanged(StockLevelChangedEvent event) {

        int threshold = settingsRepository.findTopByOrderByIdAsc()
                .filter(s -> Boolean.TRUE.equals(s.getNotificationsEnabled()))
                .map(AppSettings::getLowStockThreshold)
                .orElse(-1);

        if (threshold < 0 || event.afterQuantity() > threshold) {
            return; // notifications disabled or stock is healthy
        }

        String alertType = event.afterQuantity() == 0 ? "OUT_OF_STOCK" : "LOW_STOCK";

        StockAlertResponse alert = StockAlertResponse.builder()
                .productId(event.productId())
                .productName(event.productName())
                .sku(event.sku())
                .quantity(event.afterQuantity())
                .minStock(event.minStock())
                .type(alertType)
                .createdAt(LocalDateTime.now())
                .build();

        log.info("Stock alert dispatched post-commit: {} {} qty={}", alertType, event.sku(), event.afterQuantity());

        messagingTemplate.convertAndSend("/topic/stock-alerts", alert);
    }
}
