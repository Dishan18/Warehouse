package com.dishan.warehouse.movement.controller;

import com.dishan.warehouse.entity.MovementType;
import com.dishan.warehouse.movement.dto.MovementRequest;
import com.dishan.warehouse.movement.dto.MovementResponse;
import com.dishan.warehouse.movement.service.MovementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/movements")
@RequiredArgsConstructor
public class MovementController {

    private final MovementService movementService;

    @PostMapping("/inbound")
    @ResponseStatus(HttpStatus.CREATED)
    public MovementResponse inbound(
            @Valid @RequestBody MovementRequest request,
            Authentication authentication) {

        return movementService.inbound(request, username(authentication));
    }

    @PostMapping("/outbound")
    @ResponseStatus(HttpStatus.CREATED)
    public MovementResponse outbound(
            @Valid @RequestBody MovementRequest request,
            Authentication authentication) {

        return movementService.outbound(request, username(authentication));
    }

    @PostMapping("/adjustments")
    @ResponseStatus(HttpStatus.CREATED)
    public MovementResponse adjust(
            @Valid @RequestBody MovementRequest request,
            Authentication authentication) {

        return movementService.adjust(request, username(authentication));
    }

    @GetMapping
    public Page<MovementResponse> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) MovementType type,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        return movementService.getAll(
                search, type, productId, from, to, createPageable(page, size, sortBy, direction));
    }

    private String username(Authentication authentication) {

        return authentication == null ? "system" : authentication.getName();
    }

    private Pageable createPageable(int page, int size, String sortBy, String direction) {

        Sort.Direction sortDirection =
                "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;

        return PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
    }

}
