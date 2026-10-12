package com.dishan.warehouse.audit.service;

import com.dishan.warehouse.audit.dto.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {

    void record(String action, String entityType, Object entityId, String details);

    void record(String action, String entityType, Object entityId, String details, String performedBy);

    Page<AuditLogResponse> getAll(String search, Pageable pageable);

}
