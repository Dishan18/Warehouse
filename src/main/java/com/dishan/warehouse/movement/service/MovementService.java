package com.dishan.warehouse.movement.service;

import com.dishan.warehouse.entity.MovementType;
import com.dishan.warehouse.movement.dto.MovementRequest;
import com.dishan.warehouse.movement.dto.MovementResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.UUID;

public interface MovementService {

    MovementResponse inbound(MovementRequest request, String username);

    MovementResponse outbound(MovementRequest request, String username);

    MovementResponse adjust(MovementRequest request, String username);

    Page<MovementResponse> getAll(String search, MovementType type, UUID productId,
                                  LocalDateTime from, LocalDateTime to, Pageable pageable);

}
