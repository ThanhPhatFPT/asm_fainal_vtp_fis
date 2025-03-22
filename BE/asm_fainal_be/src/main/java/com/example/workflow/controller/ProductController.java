package com.example.workflow.controller;

import com.example.workflow.dto.ProductDTO;
import com.example.workflow.model.Product;
import com.example.workflow.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ProductController {
    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(
            @RequestParam(name = "status", required = false) Product.ProductStatus status) {
        List<Product> products = (status != null) ? productService.getProductsByStatus(status) : productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable(name = "id") UUID id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam(name = "keyword") String keyword) {
        return ResponseEntity.ok(productService.searchProducts(keyword));
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@Valid @RequestBody Product product) {
        try {
            Product savedProduct = productService.saveProduct(product);
            return ResponseEntity.ok(savedProduct);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable(name = "id") UUID id,
            @Valid @RequestBody Product product) {
        return productService.updateProduct(id, product)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<Void> toggleProductStatus(@PathVariable(name = "id") UUID id) {
        boolean updated = productService.toggleProductStatus(id);
        return updated ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/by-category/{categoryId}")
    public ResponseEntity<List<Product>> getProductsByCategory(
            @PathVariable("categoryId") String categoryId) { // Nhận String thay vì UUID
        try {
            UUID categoryUUID = UUID.fromString(categoryId); // Chuyển đổi String sang UUID
            List<Product> products = productService.getProductsByCategoryId(categoryUUID);
            if (products.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(products);
        } catch (IllegalArgumentException e) { // Xử lý lỗi UUID không hợp lệ
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @PostMapping("/import")
    public ResponseEntity<?> importProductsFromExcel(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ImportResponse(0, "Vui lòng tải lên file Excel hợp lệ", null));
            }

            String contentType = file.getContentType();
            if (!"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet".equals(contentType) &&
                    !"application/vnd.ms-excel".equals(contentType)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ImportResponse(0, "File phải có định dạng Excel (.xlsx hoặc .xls)", null));
            }

            List<Product> importedProducts = productService.importProductsFromExcel(file);
            return ResponseEntity.ok()
                    .body(new ImportResponse(importedProducts.size(), "Import thành công", importedProducts));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ImportResponse(0, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ImportResponse(0, "Lỗi khi đọc file Excel: " + e.getMessage(), null));
        }
    }

    private static class ImportResponse {
        private final int importedCount;
        private final String message;
        private final List<Product> products;

        public ImportResponse(int importedCount, String message, List<Product> products) {
            this.importedCount = importedCount;
            this.message = message;
            this.products = products;
        }

        public int getImportedCount() {
            return importedCount;
        }

        public String getMessage() {
            return message;
        }

        public List<Product> getProducts() {
            return products;
        }
    }


    @GetMapping("/top-selling")
    public List<ProductDTO> getTopSellingProducts() {
        return productService.getTopSellingProducts();
    }

    
}