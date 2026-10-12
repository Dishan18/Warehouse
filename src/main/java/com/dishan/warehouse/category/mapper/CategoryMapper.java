package com.dishan.warehouse.category.mapper;

import com.dishan.warehouse.category.dto.CategoryRequest;
import com.dishan.warehouse.category.dto.CategoryResponse;
import com.dishan.warehouse.entity.Category;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    Category toEntity(CategoryRequest request);

    CategoryResponse toResponse(Category category);

}