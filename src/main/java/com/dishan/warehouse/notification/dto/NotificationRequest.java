package com.dishan.warehouse.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record NotificationRequest(
        @NotNull(message = "Recipient is required")
        UUID recipientId,

        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title must be at most 150 characters")
        String title,

        @NotBlank(message = "Message is required")
        @Size(max = 500, message = "Message must be at most 500 characters")
        String message
) {
}
