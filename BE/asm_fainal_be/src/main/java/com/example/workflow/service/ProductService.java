package com.example.workflow.service;

import com.example.workflow.model.Category;
import com.example.workflow.model.Product;
import com.example.workflow.repository.CategoryRepository;
import com.example.workflow.repository.ProductRepository;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductService {
    private final ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(UUID id) {
        return productRepository.findById(id);
    }

    public List<Product> getProductsByStatus(Product.ProductStatus status) {
        return productRepository.findByStatus(status);
    }

    public List<Product> searchProducts(String keyword) {
        return productRepository.findByNameContainingIgnoreCase(keyword);
    }

    @Transactional
    public Optional<Product> updateProduct(UUID id, Product updatedProduct) {
        return productRepository.findById(id).map(existingProduct -> {
            existingProduct.setName(updatedProduct.getName());
            existingProduct.setPrice(updatedProduct.getPrice());
            existingProduct.setQuantity(updatedProduct.getQuantity());
            existingProduct.setDiscount(updatedProduct.getDiscount());
            existingProduct.setDescription(updatedProduct.getDescription());
            existingProduct.setImageUrls(updatedProduct.getImageUrls());
            existingProduct.setCategory(updatedProduct.getCategory());
            existingProduct.setStatus(updatedProduct.getStatus());
            return productRepository.save(existingProduct);
        });
    }

    @Transactional
    public boolean toggleProductStatus(UUID id) {
        Optional<Product> optionalProduct = productRepository.findById(id);
        if (optionalProduct.isPresent()) {
            Product product = optionalProduct.get();
            if (product.getStatus() == Product.ProductStatus.ACTIVE) {
                product.setStatus(Product.ProductStatus.OUT_OF_STOCK);
            } else if (product.getStatus() == Product.ProductStatus.OUT_OF_STOCK) {
                product.setStatus(Product.ProductStatus.ACTIVE);
            }
            productRepository.save(product);
            return true;
        }
        return false;
    }

    @Transactional
    public Product saveProduct(Product product) {
        // Kiểm tra trạng thái của Category
        Category category = product.getCategory();
        if (category == null || !"active".equalsIgnoreCase(category.getStatus())) {
            throw new IllegalArgumentException("Chỉ được chọn danh mục có trạng thái ACTIVE!");
        }

        // Kiểm tra trùng tên sản phẩm
        if (productRepository.existsByName(product.getName())) {
            throw new IllegalArgumentException("Tên sản phẩm '" + product.getName() + "' đã tồn tại. Vui lòng chọn tên khác.");
        }

        // Tạo ID mới nếu chưa có
        if (product.getId() == null) {
            product.setId(UUID.randomUUID());
        }

        return productRepository.save(product);
    }

    public List<Product> getProductsByCategoryId(UUID categoryId) {
        if (categoryId == null) {
            throw new IllegalArgumentException("Category ID cannot be null");
        }
        return productRepository.findByCategoryId(categoryId);
    }

    @Transactional
    public List<Product> importProductsFromExcel(MultipartFile file) throws IOException {
        List<Product> importedProducts = new ArrayList<>();
        List<String> duplicateNames = new ArrayList<>(); // Danh sách tên trùng lặp

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0); // Lấy sheet đầu tiên
            int headerRowIndex = 0;
            Row headerRow = sheet.getRow(headerRowIndex);

            // Kiểm tra header
            if (headerRow == null) {
                throw new IllegalArgumentException("File Excel trống");
            }

            // Duyệt qua các dòng dữ liệu (bỏ qua header)
            for (int i = headerRowIndex + 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue; // Bỏ qua dòng trống

                Product product = new Product();

                // ID (tùy chọn, nếu không có thì tự sinh)
                Cell idCell = row.getCell(0);
                if (idCell != null && idCell.getCellType() == CellType.STRING && !idCell.getStringCellValue().trim().isEmpty()) {
                    try {
                        product.setId(UUID.fromString(idCell.getStringCellValue().trim()));
                    } catch (IllegalArgumentException e) {
                        throw new IllegalArgumentException("ID không hợp lệ tại dòng " + (i + 1));
                    }
                } else {
                    product.setId(UUID.randomUUID());
                }

                // Name (bắt buộc)
                Cell nameCell = row.getCell(1);
                if (nameCell == null || nameCell.getCellType() != CellType.STRING || nameCell.getStringCellValue().trim().isEmpty()) {
                    throw new IllegalArgumentException("Tên sản phẩm không được để trống tại dòng " + (i + 1));
                }
                String productName = nameCell.getStringCellValue().trim();
                product.setName(productName);

                // Kiểm tra trùng tên sản phẩm
                if (productRepository.existsByName(productName) || importedProducts.stream().anyMatch(p -> p.getName().equals(productName))) {
                    duplicateNames.add(productName + " (dòng " + (i + 1) + ")");
                    continue; // Bỏ qua sản phẩm này nếu trùng tên
                }

                // Price (bắt buộc)
                Cell priceCell = row.getCell(2);
                if (priceCell == null || priceCell.getCellType() != CellType.NUMERIC || priceCell.getNumericCellValue() < 0) {
                    throw new IllegalArgumentException("Giá không hợp lệ (phải là số không âm) tại dòng " + (i + 1));
                }
                product.setPrice(priceCell.getNumericCellValue());

                // Quantity (bắt buộc)
                Cell quantityCell = row.getCell(3);
                if (quantityCell == null || quantityCell.getCellType() != CellType.NUMERIC || quantityCell.getNumericCellValue() < 0) {
                    throw new IllegalArgumentException("Số lượng không hợp lệ (phải là số không âm) tại dòng " + (i + 1));
                }
                product.setQuantity((int) quantityCell.getNumericCellValue());

                // Discount (tùy chọn)
                Cell discountCell = row.getCell(4);
                double discount = 0;
                if (discountCell != null && discountCell.getCellType() == CellType.NUMERIC) {
                    discount = discountCell.getNumericCellValue();
                    if (discount < 0 || discount > 100) {
                        throw new IllegalArgumentException("Giảm giá phải từ 0 đến 100 tại dòng " + (i + 1));
                    }
                }
                product.setDiscount(discount);

                // Description (bắt buộc)
                Cell descriptionCell = row.getCell(5);
                if (descriptionCell == null || descriptionCell.getCellType() != CellType.STRING || descriptionCell.getStringCellValue().trim().isEmpty()) {
                    throw new IllegalArgumentException("Mô tả không được để trống tại dòng " + (i + 1));
                }
                product.setDescription(descriptionCell.getStringCellValue().trim());

                // Image URLs (bắt buộc ít nhất 1)
                Cell imageUrlsCell = row.getCell(6);
                if (imageUrlsCell == null || imageUrlsCell.getCellType() != CellType.STRING || imageUrlsCell.getStringCellValue().trim().isEmpty()) {
                    throw new IllegalArgumentException("URL ảnh không được để trống tại dòng " + (i + 1));
                }
                List<String> imageUrls = List.of(imageUrlsCell.getStringCellValue().split(",\\s*"));
                if (imageUrls.isEmpty() || imageUrls.stream().allMatch(String::isEmpty)) {
                    throw new IllegalArgumentException("Phải có ít nhất 1 URL ảnh hợp lệ tại dòng " + (i + 1));
                }
                product.setImageUrls(imageUrls);

                // Category ID (bắt buộc)
                Cell categoryIdCell = row.getCell(7);
                if (categoryIdCell == null || categoryIdCell.getCellType() != CellType.STRING || categoryIdCell.getStringCellValue().trim().isEmpty()) {
                    throw new IllegalArgumentException("Category ID không được để trống tại dòng " + (i + 1));
                }
                UUID categoryId;
                try {
                    categoryId = UUID.fromString(categoryIdCell.getStringCellValue().trim());
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Category ID không hợp lệ tại dòng " + (i + 1));
                }
                int finalI = i;
                Category category = categoryRepository.findById(categoryId)
                        .orElseThrow(() -> new IllegalArgumentException("Danh mục không tồn tại tại dòng " + (finalI + 1)));
                if (!"active".equalsIgnoreCase(category.getStatus())) {
                    throw new IllegalArgumentException("Danh mục tại dòng " + (i + 1) + " phải có trạng thái ACTIVE");
                }
                product.setCategory(category);

                // Status (tùy chọn, mặc định ACTIVE)
                Cell statusCell = row.getCell(8);
                String statusStr = (statusCell != null && statusCell.getCellType() == CellType.STRING && !statusCell.getStringCellValue().trim().isEmpty())
                        ? statusCell.getStringCellValue().trim().toUpperCase() : "ACTIVE";
                try {
                    product.setStatus(Product.ProductStatus.valueOf(statusStr));
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Trạng thái không hợp lệ tại dòng " + (i + 1) + ". Chỉ chấp nhận ACTIVE hoặc OUT_OF_STOCK");
                }

                importedProducts.add(product);
            }

            // Nếu có tên trùng lặp, ném ngoại lệ
            if (!duplicateNames.isEmpty()) {
                throw new IllegalArgumentException("Các sản phẩm có tên sau đã tồn tại hoặc trùng lặp trong file: " + String.join(", ", duplicateNames));
            }

            // Lưu tất cả sản phẩm vào database
            return productRepository.saveAll(importedProducts);
        } catch (Exception e) {
            throw new IOException("Lỗi khi xử lý file Excel: " + e.getMessage(), e);
        }
    }

    // Hàm kiểm tra dòng trống
    private boolean isRowEmpty(Row row) {
        for (int cellNum = 0; cellNum < row.getLastCellNum(); cellNum++) {
            Cell cell = row.getCell(cellNum);
            if (cell != null && cell.getCellType() != CellType.BLANK && !cell.toString().trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    // Hàm kiểm tra sự tồn tại của tên sản phẩm
    public boolean existsByName(String name) {
        return productRepository.existsByName(name);
    }
}