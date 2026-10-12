package com.dishan.warehouse.category.service.impl;

import com.dishan.warehouse.audit.AuditConstants;
import com.dishan.warehouse.audit.service.AuditLogService;
import com.dishan.warehouse.category.dto.CategoryRequest;
import com.dishan.warehouse.category.dto.CategoryResponse;
import com.dishan.warehouse.category.mapper.CategoryMapper;
import com.dishan.warehouse.category.repository.CategoryRepository;
import com.dishan.warehouse.category.service.CategoryService;
import com.dishan.warehouse.entity.Category;
import com.dishan.warehouse.exception.DuplicateResourceException;
import com.dishan.warehouse.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    private final CategoryMapper categoryMapper;

    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public CategoryResponse create(CategoryRequest request) {

        if (categoryRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Category name already exists");
        }

        Category category = categoryMapper.toEntity(request);

        Category saved = categoryRepository.save(category);

        auditLogService.record(AuditConstants.ACTION_CREATE, AuditConstants.ENTITY_CATEGORY,
                saved.getId(), "Created category \"" + saved.getName() + "\"");

        return categoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CategoryResponse update(UUID id, CategoryRequest request) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Category not found"));

        if (categoryRepository.existsByName(request.getName())
                && !category.getName().equals(request.getName())) {
            throw new DuplicateResourceException("Category name already exists");
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setActive(request.getActive());

        Category saved = categoryRepository.save(category);

        auditLogService.record(AuditConstants.ACTION_UPDATE, AuditConstants.ENTITY_CATEGORY,
                saved.getId(), "Updated category \"" + saved.getName() + "\"");

        return categoryMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getById(UUID id) {

        return categoryRepository.findById(id)
                .map(categoryMapper::toResponse)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Category not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CategoryResponse> getAll(String search, Pageable pageable) {

        Page<Category> categories;

        if (search != null && !search.isBlank()) {
            categories = categoryRepository
                    .findByNameContainingIgnoreCase(search, pageable);
        } else {
            categories = categoryRepository.findAll(pageable);
        }

        return categories.map(categoryMapper::toResponse);
    }

    @Override
    @Transactional
    public void delete(UUID id) {

        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found");
        }

        categoryRepository.deleteById(id);

        auditLogService.record(AuditConstants.ACTION_DELETE, AuditConstants.ENTITY_CATEGORY,
                id, "Deleted category " + id);
    }

}
