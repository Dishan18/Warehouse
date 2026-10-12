package com.dishan.warehouse.notification.service;

import com.dishan.warehouse.notification.dto.NotificationRequest;
import com.dishan.warehouse.notification.dto.NotificationResponse;
import com.dishan.warehouse.notification.dto.StockAlertResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    NotificationResponse send(NotificationRequest request, String senderEmail);

    Page<NotificationResponse> getMyNotifications(String recipientEmail, Boolean unreadOnly, Pageable pageable);

    long getUnreadCount(String recipientEmail);

    NotificationResponse markAsRead(UUID id, String recipientEmail);

    void markAllRead(String recipientEmail);

    void delete(UUID id, String recipientEmail);

    List<StockAlertResponse> getAlerts();

    long getAlertCount();

}
