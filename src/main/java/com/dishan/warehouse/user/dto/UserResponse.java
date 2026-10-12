package com.dishan.warehouse.user.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class UserResponse {

    private UUID id;

    private String firstName;

    private String lastName;

    private String email;

    private String phoneNumber;

    private Boolean enabled;

    private List<String> roles;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
