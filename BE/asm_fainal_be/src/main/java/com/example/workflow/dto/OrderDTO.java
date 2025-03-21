package com.example.workflow.dto;

import com.example.workflow.model.Order;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
@Setter
public class OrderDTO {
    private UUID id;
    private LocalDateTime orderDate;
    private Double totalAmount;
    private Order.OrderStatus status;
    private Order.PaymentStatus paymentStatus;
    private UUID userId; // Chỉ trả về ID của user
    private List<OrderDetailDTO> orderDetails; // Danh sách chi tiết đơn hàng, chứa cả thông tin sản phẩm
    private String message;

    // Constructor từ Order entity
    public OrderDTO(Order order) {
        this.id = order.getId();
        this.orderDate = order.getOrderDate();
        this.totalAmount = order.getTotalAmount();
        this.status = order.getStatus();
        this.paymentStatus = order.getPaymentStatus();
        this.userId = UUID.fromString(order.getUser().getUserId());

        // Convert danh sách OrderDetail -> OrderDetailDTO
        this.orderDetails = order.getOrderDetails().stream()
                .map(OrderDetailDTO::new)
                .collect(Collectors.toList());
    }

    // Getter và Setter cho message
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
