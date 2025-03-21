package com.example.workflow.dto;

import com.example.workflow.model.OrderDetail;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class OrderDetailDTO {
    private UUID id;
    private Integer quantity;
    private Double price;
    private Double originalPrice;
    private Double discount;
    private ProductDTO product; // Trả về toàn bộ thông tin sản phẩm

    // Constructor từ OrderDetail entity
    public OrderDetailDTO(OrderDetail detail) {
        this.id = detail.getId();
        this.quantity = detail.getQuantity();
        this.price = detail.getPrice();
        this.originalPrice = detail.getOriginalPrice();
        this.discount = detail.getDiscount();
        this.product = new ProductDTO(detail.getProduct()); // Chuyển đổi Product entity thành DTO
    }
}
