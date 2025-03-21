package com.example.workflow.service;

import com.example.workflow.model.Category;
import com.example.workflow.repository.CategoryRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    // ✅ Tìm danh mục theo ID
    public Category findById(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục với ID: " + id));
    }

    // ✅ Lấy danh sách danh mục (Chỉ hiển thị danh mục còn hoạt động)
    public List<Category> findAll() {
        return categoryRepository.findAll();
    }


    // ✅ Tìm danh mục theo tên
    public Category findByName(String name) {
        return categoryRepository.findByName(name)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục với tên: " + name));
    }

    // ✅ Thêm danh mục mới (Kiểm tra trùng lặp)
    public Category saveCategory(Category category) {
        Optional<Category> existingCategory = categoryRepository.findByName(category.getName());
        if (existingCategory.isPresent()) {
            throw new IllegalArgumentException("Danh mục đã tồn tại: " + category.getName());
        }
        category.setStatus("active"); // Mặc định là active khi tạo mới
        return categoryRepository.save(category);
    }

    // ✅ Cập nhật danh mục
    @Transactional
    public Category updateCategory(UUID id, Category updatedCategory) {
        Category existingCategory = findById(id);

        if (updatedCategory.getName() != null) {
            existingCategory.setName(updatedCategory.getName());
        }
        if (updatedCategory.getCategoryImage() != null) {
            existingCategory.setCategoryImage(updatedCategory.getCategoryImage());
        }
        if (updatedCategory.getStatus() != null) {
            existingCategory.setStatus(updatedCategory.getStatus());
        }

        return categoryRepository.save(existingCategory);
    }

    // ✅ Xóa danh mục (Chỉ cập nhật trạng thái, không xóa khỏi database)
    @Transactional
    public void deleteCategory(UUID id) {
        Category category = findById(id);
        category.setStatus("inactive"); // Cập nhật trạng thái thay vì xóa
        categoryRepository.save(category);
    }

    // ✅ Khôi phục danh mục (Chuyển trạng thái thành active)
    @Transactional
    public Category restoreCategory(UUID id) {
        Category category = findById(id);
        if ("active".equals(category.getStatus())) {
            throw new IllegalStateException("Danh mục đã ở trạng thái hoạt động");
        }
        category.setStatus("active");
        return categoryRepository.save(category);
    }

    // ✅ Lấy tên danh mục theo ID
    public String getCategoryNameById(UUID id) {
        return categoryRepository.findById(id)
                .map(Category::getName)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục với ID: " + id));
    }

}
