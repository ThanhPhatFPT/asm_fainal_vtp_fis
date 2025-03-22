package com.example.workflow.repository;

import com.example.workflow.model.Order;
import com.example.workflow.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    // Tìm đơn hàng theo trạng thái
    List<Order> findByStatus(Order.OrderStatus status);


    List<Order> findByUser(User user);
    @Query("SELECT o FROM Order o WHERE o.user.userId = :userId")
    List<Order> findByUserId(@Param("userId") UUID userId);


    // Tổng doanh thu (sum of totalAmount)
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'ĐÃ_GIAO'")
    Double getTotalRevenue();

    // Tổng số đơn hàng
    // Tổng số đơn hàng (tất cả trạng thái)
    @Query("SELECT COUNT(o) FROM Order o")
    Long getTotalOrders();

    // Giá trị đơn trung bình
    @Query("SELECT AVG(o.totalAmount) FROM Order o WHERE o.status = 'ĐÃ_GIAO'")
    Double getAverageOrderValue();


    // Truy vấn đếm số lượng user duy nhất dựa trên user_id
    @Query("SELECT COUNT(DISTINCT o.user.id) FROM Order o")
    Long countDistinctUsers();

    // Truy vấn top 3 user có tổng số tiền mua hàng cao nhất
    @Query("SELECT o.user, SUM(o.totalAmount) AS totalSpent FROM Order o " +
            "WHERE o.status = 'ĐÃ_GIAO' " +
            "GROUP BY o.user " +
            "ORDER BY totalSpent DESC")
    List<Object[]> findTop3UsersBySpending();


    }