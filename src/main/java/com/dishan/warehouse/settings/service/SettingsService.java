package com.dishan.warehouse.settings.service;

import com.dishan.warehouse.settings.dto.SettingsRequest;
import com.dishan.warehouse.settings.dto.SettingsResponse;

public interface SettingsService {

    SettingsResponse getSettings();

    SettingsResponse updateSettings(SettingsRequest request);

}
