package com.dishan.warehouse.product.mapper;

import com.dishan.warehouse.entity.Product;
import com.dishan.warehouse.product.dto.ProductRequest;
import com.dishan.warehouse.product.dto.ProductResponse;
import com.dishan.warehouse.product.dto.ProductStatus;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "supplier", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Product toEntity(ProductRequest request);

    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "supplierId", source = "supplier.id")
    @Mapping(target = "supplierName", source = "supplier.name")
    @Mapping(target = "status", ignore = true)
    ProductResponse toResponse(Product product);

    @AfterMapping
    default void mapStatus(Product product, @MappingTarget ProductResponse response) {

        response.setStatus(resolveStatus(product));
    }

    static ProductStatus resolveStatus(Product product) {

        if (product.getQuantity() == 0) {
            return ProductStatus.OUT_OF_STOCK;
        }
        if (product.getQuantity() <= product.getMinStock()) {
            return ProductStatus.LOW_STOCK;
        }
        return ProductStatus.IN_STOCK;
    }

}
