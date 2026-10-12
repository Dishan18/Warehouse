package com.dishan.warehouse.auth.repository;

import com.dishan.warehouse.auth.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, UUID id);

    long countByEnabledTrueAndRolesName(String roleName);

    @Query("""
            SELECT u FROM User u
            WHERE u.enabled = true
              AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY u.firstName ASC, u.lastName ASC
            """)
    List<User> searchEnabledUsers(@Param("search") String search, Pageable pageable);

}
