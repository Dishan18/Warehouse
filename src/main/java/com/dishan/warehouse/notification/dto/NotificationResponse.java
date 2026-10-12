package com.dishan.warehouse.notification.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {

    private UUID id;

    private UUID senderId;

    private String senderName;

    private UUID recipientId;

    private String title;

    private String message;

    private String type;

    private Boolean read;

    private LocalDateTime createdAt;

}
