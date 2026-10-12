package com.dishan.warehouse.auth.service;

import com.dishan.warehouse.user.dto.CreateUserRequest;
import com.dishan.warehouse.user.dto.UpdateUserRequest;
import com.dishan.warehouse.user.dto.UserOptionResponse;
import com.dishan.warehouse.user.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface UserService {

    UserResponse createUser(CreateUserRequest request);

    UserResponse updateUser(UUID id, UpdateUserRequest request);

    UserResponse getUserById(UUID id);

    Page<UserResponse> getAllUsers(String search, Boolean enabled, Pageable pageable);

    List<UserOptionResponse> getRecipientOptions(String search);

    void deleteUser(UUID id, String currentUserEmail);

}
