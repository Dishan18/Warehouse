package com.dishan.warehouse.auth.service.impl;

import com.dishan.warehouse.audit.AuditConstants;
import com.dishan.warehouse.audit.service.AuditLogService;
import com.dishan.warehouse.auth.entity.Role;
import com.dishan.warehouse.auth.entity.User;
import com.dishan.warehouse.auth.repository.RoleRepository;
import com.dishan.warehouse.auth.repository.UserRepository;
import com.dishan.warehouse.auth.service.UserService;
import com.dishan.warehouse.exception.DuplicateResourceException;
import com.dishan.warehouse.exception.ResourceNotFoundException;
import com.dishan.warehouse.user.dto.CreateUserRequest;
import com.dishan.warehouse.user.dto.UpdateUserRequest;
import com.dishan.warehouse.user.dto.UserOptionResponse;
import com.dishan.warehouse.user.dto.UserResponse;
import com.dishan.warehouse.user.mapper.UserMapper;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final String ADMIN = "ADMIN";

    private final UserRepository userRepository;

    private final RoleRepository roleRepository;

    private final PasswordEncoder passwordEncoder;

    private final UserMapper userMapper;

    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .roles(Set.of(resolveRole(request.getRole())))
                .build();

        User saved = userRepository.save(user);

        log.info("User created: {} <{}> (id={})", saved.getEmail(), saved.getEmail(), saved.getId());

        auditLogService.record(AuditConstants.ACTION_CREATE, AuditConstants.ENTITY_USER,
                saved.getId(), "Created user \"" + saved.getEmail() + "\"");

        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new DuplicateResourceException("Email already exists");
        }

        Set<Role> roles = request.getRoles().stream()
                .map(this::resolveRole)
                .collect(Collectors.toSet());

        ensureLastAdminSafety(user, request.getEnabled(), roles);

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setEnabled(request.getEnabled());
        user.setRoles(roles);

        User saved = userRepository.save(user);

        log.info("User updated: {} (id={})", saved.getEmail(), saved.getId());

        auditLogService.record(AuditConstants.ACTION_UPDATE, AuditConstants.ENTITY_USER,
                saved.getId(), "Updated user \"" + saved.getEmail() + "\"");

        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {

        return userRepository.findById(id)
                .map(userMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(String search, Boolean enabled, Pageable pageable) {

        return userRepository
                .findAll(buildSpecification(search, enabled), pageable)
                .map(userMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserOptionResponse> getRecipientOptions(String search) {

        String query = search == null ? "" : search.trim();

        return userRepository.searchEnabledUsers(query, PageRequest.of(0, 50))
                .stream()
                .map(user -> new UserOptionResponse(
                        user.getId(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getEmail()))
                .toList();
    }

    @Override
    @Transactional
    public void deleteUser(UUID id, String currentUserEmail) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getEmail().equals(currentUserEmail)) {
            throw new IllegalArgumentException("You cannot delete your own account");
        }

        ensureLastAdminSafety(user, false, user.getRoles());

        userRepository.deleteById(id);

        log.info("User deleted: {} (id={})", user.getEmail(), id);

        auditLogService.record(AuditConstants.ACTION_DELETE, AuditConstants.ENTITY_USER,
                id, "Deleted user \"" + user.getEmail() + "\"");
    }

    private Role resolveRole(String name) {

        return roleRepository.findByName(name)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + name));
    }

    private void ensureLastAdminSafety(User target, Boolean newEnabled, Set<Role> newRoles) {

        boolean targetIsAdmin = target.getRoles().stream().anyMatch(role -> role.getName().equals(ADMIN));
        boolean keepsAdmin = newRoles.stream().anyMatch(role -> role.getName().equals(ADMIN));

        if (targetIsAdmin && (newEnabled == null || !newEnabled || !keepsAdmin)) {
            long admins = userRepository.countByEnabledTrueAndRolesName(ADMIN);
            if (admins <= 1) {
                throw new IllegalArgumentException(
                        "Cannot disable, delete or demote the last active ADMIN account");
            }
        }
    }

    private Specification<User> buildSpecification(String search, Boolean enabled) {

        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("firstName")), pattern),
                        cb.like(cb.lower(root.get("lastName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern)
                ));
            }

            if (enabled != null) {
                predicates.add(cb.equal(root.get("enabled"), enabled));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

}
