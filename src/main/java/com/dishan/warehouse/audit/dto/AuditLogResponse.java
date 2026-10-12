package com.dishan.warehouse.audit.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AuditLogResponse {

    private UUID id;

    private String action;

    private String entityType;

    private String entityId;

    private String details;

    private String performedBy;

    private LocalDateTime createdAt;

}
