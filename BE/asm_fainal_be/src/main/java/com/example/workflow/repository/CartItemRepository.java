package com.example.workflow.repository;

import com.example.workflow.model.CartItem;
import com.example.workflow.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    List<CartItem> findByUser(User user); // Tìm tất cả sản phẩm trong giỏ hàng của người dùng
}
