package com.dishan.warehouse.supplier.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SupplierResponse {

    private UUID id;

    private String name;

    private String contactName;

    private String email;

    private String phone;

    private String address;

    private Boolean active;

    private long productCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
