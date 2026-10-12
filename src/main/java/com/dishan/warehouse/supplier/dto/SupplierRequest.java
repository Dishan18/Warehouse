package com.dishan.warehouse.supplier.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SupplierRequest {

    @NotBlank(message = "Supplier name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String contactName;

    @Email(message = "Email must be valid")
    @Size(max = 150)
    private String email;

    @Size(max = 30)
    private String phone;

    @Size(max = 500)
    private String address;

    private Boolean active = true;

}
