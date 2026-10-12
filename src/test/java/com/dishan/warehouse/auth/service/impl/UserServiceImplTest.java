package com.dishan.warehouse.auth.service.impl;

import com.dishan.warehouse.audit.service.AuditLogService;
import com.dishan.warehouse.auth.entity.Role;
import com.dishan.warehouse.auth.entity.User;
import com.dishan.warehouse.auth.repository.RoleRepository;
import com.dishan.warehouse.auth.repository.UserRepository;
import com.dishan.warehouse.exception.DuplicateResourceException;
import com.dishan.warehouse.exception.ResourceNotFoundException;
import com.dishan.warehouse.user.dto.CreateUserRequest;
import com.dishan.warehouse.user.dto.UpdateUserRequest;
import com.dishan.warehouse.user.dto.UserResponse;
import com.dishan.warehouse.user.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private UserServiceImpl userService;

    private Role employeeRole;

    private Role adminRole;

    private CreateUserRequest createRequest;

    @BeforeEach
    void setUp() {
        employeeRole = new Role();
        employeeRole.setName("EMPLOYEE");

        adminRole = new Role();
        adminRole.setName("ADMIN");

        createRequest = new CreateUserRequest();
        createRequest.setFirstName("Jane");
        createRequest.setLastName("Doe");
        createRequest.setEmail("jane@warehouse.com");
        createRequest.setPassword("secret123");
        createRequest.setRole("EMPLOYEE");
    }

    @Test
    void createUser_encodesPasswordAndAssignsRole() {
        when(userRepository.existsByEmail(createRequest.getEmail())).thenReturn(false);
        when(roleRepository.findByName("EMPLOYEE")).thenReturn(Optional.of(employeeRole));
        when(passwordEncoder.encode("secret123")).thenReturn("encoded");
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toResponse(any(User.class))).thenReturn(UserResponse.builder().build());

        userService.createUser(createRequest);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();

        assertEquals("encoded", saved.getPassword());
        assertTrue(saved.getRoles().stream().anyMatch(role -> role.getName().equals("EMPLOYEE")));
    }

    @Test
    void createUser_throwsWhenEmailExists() {
        when(userRepository.existsByEmail(createRequest.getEmail())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> userService.createUser(createRequest));
    }

    @Test
    void updateUser_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userService.updateUser(id, updateRequest("EMPLOYEE", true)));
    }

    @Test
    void updateUser_throwsWhenEmailTakenByAnotherUser() {
        UUID id = UUID.randomUUID();
        User user = User.builder().id(id).email("old@warehouse.com").build();

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmailAndIdNot("jane@warehouse.com", id)).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> userService.updateUser(id, updateRequest("EMPLOYEE", true)));
    }

    @Test
    void updateUser_rejectsDemotingLastActiveAdmin() {
        UUID id = UUID.randomUUID();
        User admin = User.builder()
                .id(id)
                .email("admin@warehouse.com")
                .enabled(true)
                .roles(Set.of(adminRole))
                .build();

        when(userRepository.findById(id)).thenReturn(Optional.of(admin));
        when(userRepository.existsByEmailAndIdNot("jane@warehouse.com", id)).thenReturn(false);
        when(roleRepository.findByName("EMPLOYEE")).thenReturn(Optional.of(employeeRole));
        when(userRepository.countByEnabledTrueAndRolesName("ADMIN")).thenReturn(1L);

        assertThrows(IllegalArgumentException.class,
                () -> userService.updateUser(id, updateRequest("EMPLOYEE", true)));
    }

    @Test
    void deleteUser_rejectsSelfDeletion() {
        UUID id = UUID.randomUUID();
        User user = User.builder().id(id).email("admin@warehouse.com").build();

        when(userRepository.findById(id)).thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class,
                () -> userService.deleteUser(id, "admin@warehouse.com"));
        verify(userRepository, never()).deleteById(id);
    }

    @Test
    void deleteUser_rejectsDeletingLastActiveAdmin() {
        UUID id = UUID.randomUUID();
        User admin = User.builder()
                .id(id)
                .email("admin@warehouse.com")
                .enabled(true)
                .roles(Set.of(adminRole))
                .build();

        when(userRepository.findById(id)).thenReturn(Optional.of(admin));
        when(userRepository.countByEnabledTrueAndRolesName("ADMIN")).thenReturn(1L);

        assertThrows(IllegalArgumentException.class,
                () -> userService.deleteUser(id, "other@warehouse.com"));
        verify(userRepository, never()).deleteById(id);
    }

    @Test
    void deleteUser_deletesNonAdmin() {
        UUID id = UUID.randomUUID();
        User employee = User.builder()
                .id(id)
                .email("jane@warehouse.com")
                .roles(Set.of(employeeRole))
                .build();

        when(userRepository.findById(id)).thenReturn(Optional.of(employee));

        userService.deleteUser(id, "admin@warehouse.com");

        verify(userRepository).deleteById(id);
    }

    private UpdateUserRequest updateRequest(String role, boolean enabled) {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");
        request.setEmail("jane@warehouse.com");
        request.setEnabled(enabled);
        request.setRoles(List.of(role));
        return request;
    }
}
