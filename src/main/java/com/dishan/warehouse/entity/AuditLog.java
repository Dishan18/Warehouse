package com.dishan.warehouse.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Action is required")
    @Size(max = 50)
    @Column(nullable = false, length = 50)
    private String action;

    @NotBlank(message = "Entity type is required")
    @Size(max = 50)
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Size(max = 50)
    @Column(name = "entity_id", length = 50)
    private String entityId;

    @Size(max = 500)
    @Column(length = 500)
    private String details;

    @Size(max = 150)
    @Column(name = "performed_by", nullable = false, length = 150)
    private String performedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

}
