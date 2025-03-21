package com.example.workflow.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @PrePersist
    public void generateUUID() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate; // Thời gian đặt hàng

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount; // Tổng tiền đơn hàng

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private OrderStatus status; // Trạng thái đơn hàng

    @Column(name = "payment_status", nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus; // Trạng thái thanh toán

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Người đặt hàng

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference // Quản lý phía "chính" của quan hệ
    private List<OrderDetail> orderDetails = new ArrayList<>(); // Danh sách chi tiết đơn hàng

    // Enum cho trạng thái đơn hàng
    public enum OrderStatus {
        CHỜ_XÁC_NHẬN, CHỜ_LẤY_HÀNG, CHỜ_GIAO_HÀNG, ĐÃ_GIAO, ĐÃ_HỦY
    }

    // Enum cho trạng thái thanh toán
    public enum PaymentStatus {
        CHƯA_THANH_TOÁN, THANH_TOÁN_MỘT_PHẦN, ĐÃ_THANH_TOÁN
    }
}