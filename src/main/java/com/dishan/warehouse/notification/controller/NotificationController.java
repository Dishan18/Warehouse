package com.dishan.warehouse.notification.controller;

import com.dishan.warehouse.notification.dto.NotificationRequest;
import com.dishan.warehouse.notification.dto.NotificationResponse;
import com.dishan.warehouse.notification.dto.StockAlertResponse;
import com.dishan.warehouse.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationResponse> send(
            @Valid @RequestBody NotificationRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(notificationService.send(request, currentUser.getUsername()));
    }

    @GetMapping
    public Page<NotificationResponse> getMyNotifications(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        return notificationService.getMyNotifications(
                currentUser.getUsername(), unreadOnly, createPageable(page, size, sortBy, direction));
    }

    @GetMapping("/unread-count")
    public long getUnreadCount(@AuthenticationPrincipal UserDetails currentUser) {

        return notificationService.getUnreadCount(currentUser.getUsername());
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails currentUser) {

        return notificationService.markAsRead(id, currentUser.getUsername());
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@AuthenticationPrincipal UserDetails currentUser) {

        notificationService.markAllRead(currentUser.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails currentUser) {

        notificationService.delete(id, currentUser.getUsername());
    }

    @GetMapping("/stock-alerts")
    public List<StockAlertResponse> getAlerts() {

        return notificationService.getAlerts();
    }

    @GetMapping("/stock-alert-count")
    public long getAlertCount() {

        return notificationService.getAlertCount();
    }

    private Pageable createPageable(int page, int size, String sortBy, String direction) {

        Sort.Direction sortDirection =
                "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;

        return PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
    }

}
