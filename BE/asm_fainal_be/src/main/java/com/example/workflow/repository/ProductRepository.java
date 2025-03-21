package com.example.workflow.repository;

import com.example.workflow.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    // Lấy danh sách sản phẩm theo trạng thái
    List<Product> findByStatus(Product.ProductStatus status);

    // Tìm kiếm sản phẩm theo tên (chứa từ khóa)
    List<Product> findByNameContainingIgnoreCase(String name);

    // Thêm phương thức mới: Tìm sản phẩm theo category_id
    List<Product> findByCategoryId(UUID categoryId);

    boolean existsByName(String name); // Thêm phương thức này
}