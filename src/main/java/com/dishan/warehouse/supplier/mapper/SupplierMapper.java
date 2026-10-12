package com.dishan.warehouse.supplier.mapper;

import com.dishan.warehouse.entity.Supplier;
import com.dishan.warehouse.supplier.dto.SupplierRequest;
import com.dishan.warehouse.supplier.dto.SupplierResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SupplierMapper {

    Supplier toEntity(SupplierRequest request);

    @Mapping(target = "productCount", ignore = true)
    SupplierResponse toResponse(Supplier supplier);

}
