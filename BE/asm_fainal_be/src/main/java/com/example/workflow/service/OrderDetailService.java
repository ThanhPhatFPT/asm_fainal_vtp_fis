package com.example.workflow.service;

import com.example.workflow.model.OrderDetail;
import com.example.workflow.repository.OrderDetailRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class OrderDetailService {

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    // Lấy tất cả chi tiết đơn hàng
    public List<OrderDetail> getAllOrderDetails() {
        return orderDetailRepository.findAll();
    }

    // Lấy chi tiết đơn hàng theo ID
    public Optional<OrderDetail> getOrderDetailById(UUID id) {
        return orderDetailRepository.findById(id);
    }

    // Lấy chi tiết đơn hàng theo orderId
    public List<OrderDetail> getOrderDetailsByOrderId(UUID orderId) {
        return orderDetailRepository.findByOrderId(orderId);
    }

    // Tạo chi tiết đơn hàng mới
    @Transactional
    public OrderDetail createOrderDetail(OrderDetail orderDetail) {
        return orderDetailRepository.save(orderDetail);
    }

    // Cập nhật chi tiết đơn hàng
    @Transactional
    public OrderDetail updateOrderDetail(UUID id, OrderDetail updatedDetail) {
        Optional<OrderDetail> optionalDetail = orderDetailRepository.findById(id);
        if (optionalDetail.isPresent()) {
            OrderDetail detail = optionalDetail.get();
            detail.setQuantity(updatedDetail.getQuantity());
            detail.setPrice(updatedDetail.getPrice());
            detail.setOriginalPrice(updatedDetail.getOriginalPrice());
            detail.setDiscount(updatedDetail.getDiscount());
            return orderDetailRepository.save(detail);
        } else {
            throw new RuntimeException("OrderDetail not found with id: " + id);
        }
    }

    // Xóa chi tiết đơn hàng
    @Transactional
    public void deleteOrderDetail(UUID id) {
        orderDetailRepository.deleteById(id);
    }
}