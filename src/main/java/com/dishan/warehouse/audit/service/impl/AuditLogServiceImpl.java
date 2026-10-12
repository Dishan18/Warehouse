package com.dishan.warehouse.audit.service.impl;

import com.dishan.warehouse.audit.dto.AuditLogResponse;
import com.dishan.warehouse.audit.mapper.AuditLogMapper;
import com.dishan.warehouse.audit.repository.AuditLogRepository;
import com.dishan.warehouse.audit.service.AuditLogService;
import com.dishan.warehouse.entity.AuditLog;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private static final String SYSTEM = "system";

    private final AuditLogRepository auditLogRepository;

    private final AuditLogMapper auditLogMapper;

    @Override
    @Transactional
    public void record(String action, String entityType, Object entityId, String details) {

        record(action, entityType, entityId, details, currentUser());
    }

    @Override
    @Transactional
    public void record(String action, String entityType, Object entityId, String details,
                       String performedBy) {

        AuditLog log = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId == null ? null : entityId.toString())
                .details(details)
                .performedBy(performedBy)
                .build();

        auditLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAll(String search, Pageable pageable) {

        return auditLogRepository
                .findAll(buildSpecification(search), pageable)
                .map(auditLogMapper::toResponse);
    }

    private String currentUser() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return SYSTEM;
        }

        return authentication.getName();
    }

    private Specification<AuditLog> buildSpecification(String search) {

        return (root, query, cb) -> {

            if (search == null || search.isBlank()) {
                return cb.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();
            String pattern = "%" + search.trim().toLowerCase() + "%";

            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("action")), pattern),
                    cb.like(cb.lower(root.get("entityType")), pattern),
                    cb.like(cb.lower(root.get("details")), pattern),
                    cb.like(cb.lower(root.get("performedBy")), pattern)
            ));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

}
