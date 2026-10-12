package com.dishan.warehouse.dashboard.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryProductCount {

    private String name;

    private long productCount;

}
