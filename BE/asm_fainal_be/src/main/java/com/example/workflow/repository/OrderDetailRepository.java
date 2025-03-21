package com.example.workflow.repository;

import com.example.workflow.model.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, UUID> {
    // Tìm chi tiết đơn hàng theo orderId
    List<OrderDetail> findByOrderId(UUID orderId);
}