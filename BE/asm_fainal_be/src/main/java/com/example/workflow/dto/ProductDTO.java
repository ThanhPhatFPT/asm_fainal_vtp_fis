package com.example.workflow.dto;

import com.example.workflow.model.Product;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ProductDTO {
    private UUID id;
    private String name;
    private Double price;
    private Integer quantity;
    private Double discount;
    private String description;
    private List<String> imageUrls;
    private String categoryName;
    private Product.ProductStatus status;

    // Constructor từ Product entity
    public ProductDTO(Product product) {
        this.id = product.getId();
        this.name = product.getName();
        this.price = product.getPrice();
        this.quantity = product.getQuantity();
        this.discount = product.getDiscount();
        this.description = product.getDescription();
        this.imageUrls = product.getImageUrls();
        this.categoryName = product.getCategory().getName();
        this.status = product.getStatus();
    }
}
