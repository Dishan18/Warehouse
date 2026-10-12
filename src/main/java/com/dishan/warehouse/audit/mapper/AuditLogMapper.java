package com.dishan.warehouse.audit.mapper;

import com.dishan.warehouse.audit.dto.AuditLogResponse;
import com.dishan.warehouse.entity.AuditLog;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AuditLogMapper {

    AuditLogResponse toResponse(AuditLog auditLog);

}
