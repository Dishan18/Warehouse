package com.dishan.warehouse.notification.service.impl;

import com.dishan.warehouse.audit.service.AuditLogService;
import com.dishan.warehouse.auth.entity.User;
import com.dishan.warehouse.auth.repository.UserRepository;
import com.dishan.warehouse.entity.Notification;
import com.dishan.warehouse.exception.ResourceNotFoundException;
import com.dishan.warehouse.notification.dto.NotificationRequest;
import com.dishan.warehouse.notification.dto.NotificationResponse;
import com.dishan.warehouse.notification.mapper.NotificationMapper;
import com.dishan.warehouse.notification.repository.NotificationRepository;
import com.dishan.warehouse.product.repository.ProductRepository;
import com.dishan.warehouse.settings.repository.AppSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationMapper notificationMapper;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private AppSettingsRepository settingsRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User sender;

    private User recipient;

    private NotificationRequest request;

    @BeforeEach
    void setUp() {

        sender = User.builder().id(UUID.randomUUID()).email("sender@test.com").build();
        recipient = User.builder().id(UUID.randomUUID()).email("recipient@test.com").build();

        request = new NotificationRequest(recipient.getId(), "Test title", "Test message");
    }

    @Test
    void send_persistsNotificationWithUserMessageTypeAndPushesToRecipient() {

        Notification saved = Notification.builder()
                .id(UUID.randomUUID())
                .sender(sender)
                .recipient(recipient)
                .title("Test title")
                .message("Test message")
                .type("USER_MESSAGE")
                .isRead(false)
                .build();

        NotificationResponse response = NotificationResponse.builder()
                .id(saved.getId())
                .senderId(sender.getId())
                .senderName(sender.getEmail())
                .recipientId(recipient.getId())
                .title("Test title")
                .message("Test message")
                .type("USER_MESSAGE")
                .read(false)
                .build();

        when(userRepository.findByEmail("sender@test.com")).thenReturn(Optional.of(sender));
        when(userRepository.findById(recipient.getId())).thenReturn(Optional.of(recipient));
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);
        when(notificationMapper.toResponse(saved)).thenReturn(response);

        NotificationResponse result = notificationService.send(request, "sender@test.com");

        assertEquals("Test title", result.getTitle());
        assertEquals(recipient.getId(), result.getRecipientId());
        assertEquals("USER_MESSAGE", result.getType());

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertEquals(sender, captor.getValue().getSender());
        assertEquals(recipient, captor.getValue().getRecipient());

        verify(messagingTemplate).convertAndSendToUser(
                recipient.getEmail(), "/queue/notifications", response);
    }

    @Test
    void send_throwsWhenRecipientNotFound() {

        when(userRepository.findByEmail("sender@test.com")).thenReturn(Optional.of(sender));
        when(userRepository.findById(recipient.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> notificationService.send(request, "sender@test.com"));

        verify(notificationRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSendToUser(
                any(), any(), any());
    }

    @Test
    void getMyNotifications_returnsRecipientInbox() {

        Notification notification = Notification.builder()
                .id(UUID.randomUUID())
                .recipient(recipient)
                .title("Test title")
                .type("USER_MESSAGE")
                .build();

        when(userRepository.findByEmail("recipient@test.com")).thenReturn(Optional.of(recipient));
        when(notificationRepository.findByRecipientOrderByCreatedAtDesc(
                recipient, Pageable.unpaged()))
                .thenReturn(new PageImpl<>(List.of(notification)));
        when(notificationMapper.toResponse(notification))
                .thenReturn(NotificationResponse.builder().title("Test title").build());

        var result = notificationService.getMyNotifications(
                "recipient@test.com", null, Pageable.unpaged());

        assertEquals(1, result.getTotalElements());
        verify(notificationRepository).findByRecipientOrderByCreatedAtDesc(
                recipient, Pageable.unpaged());
    }

    @Test
    void getUnreadCount_returnsOnlyUnreadForRecipient() {

        when(userRepository.findByEmail("recipient@test.com")).thenReturn(Optional.of(recipient));
        when(notificationRepository.countByRecipientAndIsReadFalse(recipient)).thenReturn(3L);

        long count = notificationService.getUnreadCount("recipient@test.com");

        assertEquals(3L, count);
        verify(notificationRepository).countByRecipientAndIsReadFalse(recipient);
    }

    @Test
    void markAsRead_marksOwnedNotificationRead() {

        Notification notification = Notification.builder()
                .id(UUID.randomUUID())
                .recipient(recipient)
                .isRead(false)
                .build();

        when(userRepository.findByEmail("recipient@test.com")).thenReturn(Optional.of(recipient));
        when(notificationRepository.findByIdAndRecipient(notification.getId(), recipient))
                .thenReturn(Optional.of(notification));
        when(notificationRepository.save(notification)).thenReturn(notification);

        notificationService.markAsRead(notification.getId(), "recipient@test.com");

        assertEquals(true, notification.getIsRead());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_throwsWhenNotificationBelongsToAnotherUser() {

        User other = User.builder().id(UUID.randomUUID()).email("other@test.com").build();

        when(userRepository.findByEmail("recipient@test.com")).thenReturn(Optional.of(recipient));
        when(notificationRepository.findByIdAndRecipient(any(UUID.class), any(User.class)))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> notificationService.markAsRead(UUID.randomUUID(), "recipient@test.com"));

        verify(notificationRepository, never()).save(any());
    }

    @Test
    void delete_onlyRemovesNotificationOwnedByRecipient() {

        Notification notification = Notification.builder()
                .id(UUID.randomUUID())
                .recipient(recipient)
                .build();

        when(userRepository.findByEmail("recipient@test.com")).thenReturn(Optional.of(recipient));
        when(notificationRepository.findByIdAndRecipient(notification.getId(), recipient))
                .thenReturn(Optional.of(notification));

        notificationService.delete(notification.getId(), "recipient@test.com");

        verify(notificationRepository).delete(notification);
    }

    @Test
    void delete_throwsWhenNotificationDoesNotExist() {

        when(userRepository.findByEmail("recipient@test.com")).thenReturn(Optional.of(recipient));
        when(notificationRepository.findByIdAndRecipient(any(UUID.class), any(User.class)))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> notificationService.delete(UUID.randomUUID(), "recipient@test.com"));

        verify(notificationRepository, never()).delete(any());
    }

}
