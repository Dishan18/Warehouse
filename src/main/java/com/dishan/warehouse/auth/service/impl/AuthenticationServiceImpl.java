package com.dishan.warehouse.auth.service.impl;

import com.dishan.warehouse.audit.AuditConstants;
import com.dishan.warehouse.audit.service.AuditLogService;
import com.dishan.warehouse.auth.dto.AuthResponse;
import com.dishan.warehouse.auth.dto.LoginRequest;
import com.dishan.warehouse.auth.dto.RegisterRequest;
import com.dishan.warehouse.auth.entity.Role;
import com.dishan.warehouse.auth.entity.User;
import com.dishan.warehouse.auth.repository.RoleRepository;
import com.dishan.warehouse.auth.repository.UserRepository;
import com.dishan.warehouse.auth.security.JwtService;
import com.dishan.warehouse.auth.service.AuthenticationService;
import com.dishan.warehouse.exception.DuplicateResourceException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AuditLogService auditLogService;

    @Override
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }

        Role role = roleRepository.findByName("EMPLOYEE")
                .orElseThrow(() -> new RuntimeException("Default role not found"));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .roles(Set.of(role))
                .build();

        userRepository.save(user);

        auditLogService.record(AuditConstants.ACTION_REGISTER, AuditConstants.ENTITY_USER,
                user.getId(), "Registered account \"" + user.getEmail() + "\"",
                user.getEmail());

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .roles(roleNames(user))
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        auditLogService.record(AuditConstants.ACTION_LOGIN, AuditConstants.ENTITY_USER,
                user.getId(), "Logged in as \"" + user.getEmail() + "\"",
                user.getEmail());

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .roles(roleNames(user))
                .build();
    }

    private List<String> roleNames(User user) {

        return user.getRoles().stream().map(Role::getName).toList();
    }
}