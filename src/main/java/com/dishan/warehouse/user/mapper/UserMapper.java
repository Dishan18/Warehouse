package com.dishan.warehouse.user.mapper;

import com.dishan.warehouse.auth.entity.Role;
import com.dishan.warehouse.auth.entity.User;
import com.dishan.warehouse.user.dto.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "roles", expression = "java(mapRoles(user.getRoles()))")
    UserResponse toResponse(User user);

    default List<String> mapRoles(Set<Role> roles) {

        return roles.stream()
                .map(Role::getName)
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toList());
    }

}
