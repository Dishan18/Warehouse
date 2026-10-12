package com.dishan.warehouse.settings.repository;

import com.dishan.warehouse.entity.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AppSettingsRepository extends JpaRepository<AppSettings, UUID> {

    Optional<AppSettings> findTopByOrderByIdAsc();

}
