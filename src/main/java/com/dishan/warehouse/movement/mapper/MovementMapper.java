package com.dishan.warehouse.movement.mapper;

import com.dishan.warehouse.entity.StockMovement;
import com.dishan.warehouse.movement.dto.MovementResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MovementMapper {

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "sku", source = "product.sku")
    MovementResponse toResponse(StockMovement movement);

}
