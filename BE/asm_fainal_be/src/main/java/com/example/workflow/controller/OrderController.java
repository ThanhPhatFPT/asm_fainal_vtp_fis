package com.example.workflow.controller;

import com.example.workflow.dto.ApiResponse;
import com.example.workflow.dto.OrderDTO;
import com.example.workflow.model.Order;
import com.example.workflow.model.User;
import com.example.workflow.repository.UserRepository;
import com.example.workflow.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    // Lấy tất cả đơn hàng
    @GetMapping("/getAll")
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        List<OrderDTO> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    // Tạo đơn hàng
    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Order order = orderService.createOrder(user);
        return ResponseEntity.ok(new OrderDTO(order));
    }

    // Lấy danh sách đơn hàng của người dùng
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByUser(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<OrderDTO> orders = orderService.getOrdersByUser(user);
        return ResponseEntity.ok(orders);
    }

    // Lấy chi tiết đơn hàng
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable("orderId") UUID orderId) {
        OrderDTO order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }

    // Hủy đơn hàng (Người dùng đăng nhập)
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse> cancelOrder(@PathVariable UUID orderId, @AuthenticationPrincipal User user) {
        try {
            orderService.cancelOrder(orderId, user);
            return ResponseEntity.ok(new ApiResponse("Cập nhật trạng thái đơn hàng thành ĐÃ_HỦY thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    // Cập nhật trạng thái đơn hàng (Admin)
    @PutMapping("/{orderId}/status")
    public ResponseEntity<ApiResponse> updateOrderStatus(@PathVariable UUID orderId, @RequestBody String status) {
        try {
            orderService.updateOrderStatus(orderId, status);
            return ResponseEntity.ok(new ApiResponse("Cập nhật trạng thái đơn hàng thành " + status + " thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }



    // Chuyển sang CHỜ_LẤY_HÀNG
    @PutMapping("/{orderId}/waiting-pickup")
    public ResponseEntity<ApiResponse> setOrderToWaitingPickup(@PathVariable("orderId") UUID orderId) {
        try {
            orderService.setOrderToWaitingPickup(orderId);
            return ResponseEntity.ok(new ApiResponse("Cập nhật trạng thái đơn hàng thành CHỜ_LẤY_HÀNG thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    // Chuyển sang CHỜ_GIAO_HÀNG
    @PutMapping("/{orderId}/waiting-delivery")
    public ResponseEntity<ApiResponse> setOrderToWaitingDelivery(@PathVariable("orderId") UUID orderId) {
        try {
            orderService.setOrderToWaitingDelivery(orderId);
            return ResponseEntity.ok(new ApiResponse("Cập nhật trạng thái đơn hàng thành CHỜ_GIAO_HÀNG thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    // Chuyển sang ĐÃ_GIAO
    @PutMapping("/{orderId}/delivered")
    public ResponseEntity<ApiResponse> setOrderToDelivered(@PathVariable("orderId") UUID orderId) {
        try {
            orderService.setOrderToDelivered(orderId);
            return ResponseEntity.ok(new ApiResponse("Cập nhật trạng thái đơn hàng thành ĐÃ_GIAO thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    // Xác nhận giao hàng
    @PostMapping("/{orderId}/confirm-delivery")
    public ResponseEntity<ApiResponse> confirmOrderDelivered(
            @PathVariable("orderId") UUID orderId,
            @AuthenticationPrincipal User user) {
        try {
            orderService.confirmOrderDelivered(orderId, user);
            return ResponseEntity.ok(new ApiResponse("Xác nhận giao hàng thành công, đơn hàng đã hoàn tất"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    // Hủy đơn hàng (Quản trị viên)
    @PutMapping("/{orderId}/cancel-admin")
    public ResponseEntity<ApiResponse> setOrderToCancelled(@PathVariable("orderId") UUID orderId) {
        try {
            orderService.setOrderToCancelled(orderId);
            return ResponseEntity.ok(new ApiResponse("Cập nhật trạng thái đơn hàng thành ĐÃ_HỦY thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }


    @PutMapping("/{orderId}/cancel-user")
    public ResponseEntity<ApiResponse> setOrderToCancelledUser(@PathVariable("orderId") UUID orderId) {
        try {
            orderService.setOrderToCancelled(orderId);
            return ResponseEntity.ok(new ApiResponse("Cập nhật trạng thái đơn hàng thành ĐÃ_HỦY thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }


    // Tổng doanh thu
    @GetMapping("/statistics/total-revenue")
    public ResponseEntity<Double> getTotalRevenue() {
        return ResponseEntity.ok(orderService.getTotalRevenue());
    }

    // Tổng số đơn hàng
    @GetMapping("/statistics/total-orders")
    public ResponseEntity<Long> getTotalOrders() {
        return ResponseEntity.ok(orderService.getTotalOrders());
    }

    // Giá trị đơn trung bình
    @GetMapping("/statistics/average-order-value")
    public ResponseEntity<Double> getAverageOrderValue() {
        return ResponseEntity.ok(orderService.getAverageOrderValue());
    }

    // Thống kê số lượng user đã đặt hàng
    @GetMapping("/statistics/total-unique-users")
    public ResponseEntity<Long> getUniqueUserCount() {
        return ResponseEntity.ok(orderService.getUniqueUserCount());
    }





}