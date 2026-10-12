package com.dishan.warehouse.settings.controller;

import com.dishan.warehouse.settings.dto.SettingsRequest;
import com.dishan.warehouse.settings.dto.SettingsResponse;
import com.dishan.warehouse.settings.service.SettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public SettingsResponse getSettings() {
        return settingsService.getSettings();
    }

    @PutMapping
    public SettingsResponse updateSettings(@Valid @RequestBody SettingsRequest request) {
        return settingsService.updateSettings(request);
    }

}
