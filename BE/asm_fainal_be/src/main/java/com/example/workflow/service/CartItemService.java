package com.example.workflow.service;

import com.example.workflow.model.CartItem;
import com.example.workflow.model.Product;
import com.example.workflow.model.User;
import com.example.workflow.repository.CartItemRepository;
import com.example.workflow.repository.ProductRepository;
import com.example.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartItemService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<CartItem> getAllCartItems() {
        return cartItemRepository.findAll();
    }

    // Lấy danh sách giỏ hàng theo User
    public List<CartItem> getCartItemsByUser(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("ID người dùng không được để trống");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));
        return cartItemRepository.findByUser(user);
    }

    // Thêm sản phẩm vào giỏ hàng
    @Transactional
    public CartItem addToCart(String userId, UUID productId, int quantity) {
        if (userId == null || productId == null || quantity <= 0) {
            throw new IllegalArgumentException("Dữ liệu đầu vào không hợp lệ");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + productId));

        // Tìm sản phẩm trong giỏ dựa trên productId
        return cartItemRepository.findByUser(user).stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst()
                .map(cartItem -> {
                    cartItem.setQuantity(cartItem.getQuantity() + quantity);
                    return cartItemRepository.save(cartItem);
                })
                .orElseGet(() -> {
                    CartItem newCartItem = new CartItem();
                    newCartItem.setUser(user);
                    newCartItem.setProduct(product);
                    newCartItem.setQuantity(quantity);
                    return cartItemRepository.save(newCartItem);
                });
    }

    // Xóa sản phẩm khỏi giỏ hàng
    @Transactional
    public void removeFromCart(UUID cartItemId) {
        if (cartItemId == null) {
            throw new IllegalArgumentException("ID mục giỏ hàng không được để trống");
        }
        if (!cartItemRepository.existsById(cartItemId)) {
            throw new RuntimeException("Không tìm thấy mục giỏ hàng với ID: " + cartItemId);
        }
        cartItemRepository.deleteById(cartItemId);
    }

    // Cập nhật số lượng sản phẩm trong giỏ
    @Transactional
    public CartItem updateQuantity(UUID cartItemId, int quantity) {
        if (cartItemId == null || quantity <= 0) {
            throw new IllegalArgumentException("ID hoặc số lượng không hợp lệ");
        }
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mục giỏ hàng với ID: " + cartItemId));
        cartItem.setQuantity(quantity);
        return cartItemRepository.save(cartItem);
    }

    // Xóa toàn bộ giỏ hàng của một user
    @Transactional
    public void clearCart(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("ID người dùng không được để trống");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));
        cartItemRepository.deleteAll(cartItemRepository.findByUser(user));
    }
}