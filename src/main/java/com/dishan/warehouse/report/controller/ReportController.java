package com.dishan.warehouse.report.controller;

import com.dishan.warehouse.entity.MovementType;
import com.dishan.warehouse.product.dto.ProductStatus;
import com.dishan.warehouse.report.dto.InventoryReportResponse;
import com.dishan.warehouse.report.service.AnalyticsReportService;
import com.dishan.warehouse.report.service.CsvReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final CsvReportService csvReportService;

    private final AnalyticsReportService analyticsReportService;

    @GetMapping(value = "/inventory/analytics", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<InventoryReportResponse> inventoryAnalytics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        LocalDateTime from = startDate != null && !startDate.isBlank()
                ? LocalDate.parse(startDate).atStartOfDay() : null;
        LocalDateTime to = endDate != null && !endDate.isBlank()
                ? LocalDate.parse(endDate).plusDays(1).atStartOfDay() : null;

        return ResponseEntity.ok(analyticsReportService.generateInventoryReport(from, to));
    }

    @GetMapping(value = "/products", produces = "text/csv")
    public ResponseEntity<byte[]> exportProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) ProductStatus status) {

        return csv(csvReportService.exportProducts(search, categoryId, status), "products.csv");
    }

    @GetMapping(value = "/movements", produces = "text/csv")
    public ResponseEntity<byte[]> exportMovements(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) MovementType type,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        return csv(csvReportService.exportMovements(search, type, productId, from, to),
                "movements.csv");
    }

    @GetMapping(value = "/inventory", produces = "text/csv")
    public ResponseEntity<byte[]> exportInventory() {

        return csv(csvReportService.exportInventory(), "inventory.csv");
    }

    private ResponseEntity<byte[]> csv(String content, String filename) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build());

        return new ResponseEntity<>(content.getBytes(StandardCharsets.UTF_8), headers, HttpStatus.OK);
    }

}
