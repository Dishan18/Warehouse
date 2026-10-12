package com.dishan.warehouse.notification.repository;

import com.dishan.warehouse.auth.entity.User;
import com.dishan.warehouse.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);

    Page<Notification> findByRecipientAndIsReadOrderByCreatedAtDesc(User recipient, Boolean isRead, Pageable pageable);

    long countByRecipientAndIsReadFalse(User recipient);

    Optional<Notification> findByIdAndRecipient(UUID id, User recipient);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient = :recipient AND n.isRead = false")
    int markAllRead(@Param("recipient") User recipient);

}
