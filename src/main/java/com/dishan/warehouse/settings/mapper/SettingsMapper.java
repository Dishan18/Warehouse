package com.dishan.warehouse.settings.mapper;

import com.dishan.warehouse.entity.AppSettings;
import com.dishan.warehouse.settings.dto.SettingsResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SettingsMapper {

    SettingsResponse toResponse(AppSettings settings);

}
