package com.dishan.warehouse.dashboard.controller;

import com.dishan.warehouse.dashboard.dto.DashboardSummaryResponse;
import com.dishan.warehouse.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public DashboardSummaryResponse getSummary() {

        return dashboardService.getSummary();
    }

}
