package com.example.workflow.repository;

import com.example.workflow.model.OrderDetail;
import com.example.workflow.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, UUID> {
    // Tìm chi tiết đơn hàng theo orderId
    List<OrderDetail> findByOrderId(UUID orderId);

    @Query("SELECT od.product FROM OrderDetail od GROUP BY od.product ORDER BY SUM(od.quantity) DESC")
    List<Product> findTopSellingProducts();
}