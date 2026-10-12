package com.dishan.warehouse.auth.controller;

import com.dishan.warehouse.auth.dto.AuthResponse;
import com.dishan.warehouse.auth.dto.LoginRequest;
import com.dishan.warehouse.auth.dto.RegisterRequest;
import com.dishan.warehouse.auth.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request) {

        return authenticationService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request) {

        return authenticationService.login(request);
    }
}