package com.dishan.warehouse.auth.service;

import com.dishan.warehouse.auth.dto.AuthResponse;
import com.dishan.warehouse.auth.dto.LoginRequest;
import com.dishan.warehouse.auth.dto.RegisterRequest;

public interface AuthenticationService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

}
