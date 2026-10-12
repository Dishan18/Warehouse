package com.dishan.warehouse.report.service;

import com.dishan.warehouse.report.dto.InventoryReportResponse;

import java.time.LocalDateTime;

public interface AnalyticsReportService {

    InventoryReportResponse generateInventoryReport(LocalDateTime from, LocalDateTime to);
}
