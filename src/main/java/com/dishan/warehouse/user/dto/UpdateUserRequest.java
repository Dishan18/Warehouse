package com.dishan.warehouse.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateUserRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 150)
    private String email;

    @Size(max = 20)
    private String phoneNumber;

    private Boolean enabled = true;

    @NotEmpty(message = "At least one role is required")
    private List<@Pattern(regexp = "ADMIN|MANAGER|EMPLOYEE",
            message = "Role must be ADMIN, MANAGER or EMPLOYEE") String> roles;

}
