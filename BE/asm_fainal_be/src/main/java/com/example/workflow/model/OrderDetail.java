package com.example.workflow.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "order_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @PrePersist
    public void generateUUID() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

    @Column(nullable = false)
    private Integer quantity; // Số lượng sản phẩm

    @Column(name = "price", nullable = false)
    private Double price; // Giá tại thời điểm đặt hàng

    @Column(name = "original_price", nullable = false)
    private Double originalPrice; // Giá gốc của sản phẩm

    @Column(name = "discount")
    private Double discount; // Giảm giá (nếu có)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product; // Sản phẩm

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonBackReference // Phía "phụ" của quan hệ, không serialize ngược lại
    private Order order; // Đơn hàng chứa chi tiết này
}