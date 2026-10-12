package com.dishan.warehouse.report.service;

import com.dishan.warehouse.entity.MovementType;
import com.dishan.warehouse.product.dto.ProductStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public interface CsvReportService {

    String exportProducts(String search, UUID categoryId, ProductStatus status);

    String exportMovements(String search, MovementType type, UUID productId,
                           LocalDateTime from, LocalDateTime to);

    String exportInventory();

}
