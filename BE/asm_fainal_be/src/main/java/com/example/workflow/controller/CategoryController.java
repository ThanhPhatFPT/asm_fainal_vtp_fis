package com.example.workflow.controller;

import com.example.workflow.model.Category;
import com.example.workflow.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // ✅ Lấy tất cả danh mục (chỉ hiển thị danh mục active)
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.findAll());
    }

    // ✅ Lấy danh mục theo ID
    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable String id) {
        UUID categoryId = UUID.fromString(id); // Ép kiểu String → UUID
        return ResponseEntity.ok(categoryService.findById(categoryId));
    }

    // ✅ Lấy danh mục theo tên
    @GetMapping("/name/{name}")
    public ResponseEntity<Category> getCategoryByName(@PathVariable String name) {
        return ResponseEntity.ok(categoryService.findByName(name));
    }

    // ✅ Thêm danh mục mới
    @PostMapping
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryService.saveCategory(category));
    }

    @PutMapping("/{id}")
    public Category updateCategory(@PathVariable("id") UUID id, @RequestBody Category updatedCategory) {
        return categoryService.updateCategory(id, updatedCategory);
    }
    // ✅ Vô hiệu hóa danh mục (Cập nhật trạng thái thành "inactive")
    @PutMapping("/{id}/disable")
    public ResponseEntity<String> disableCategory(@PathVariable("id") String id) {
        UUID categoryId = UUID.fromString(id);
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.ok("Danh mục đã được vô hiệu hóa");
    }


    @PutMapping("/{id}/restore")
    public ResponseEntity<Map<String, Object>> restoreCategory(@PathVariable("id") UUID id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Category restoredCategory = categoryService.restoreCategory(id);
            response.put("message", "Danh mục đã được phục hồi thành công");
            return ResponseEntity.ok(response);
        } catch (IllegalStateException | IllegalArgumentException e) {
            response.put("error", "Yêu cầu không hợp lệ");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            response.put("error", "Lỗi máy chủ");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/{id}/name")
    public ResponseEntity<String> getCategoryNameById(@PathVariable UUID id) {
        try {
            String categoryName = categoryService.getCategoryNameById(id);
            return ResponseEntity.ok(categoryName);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
