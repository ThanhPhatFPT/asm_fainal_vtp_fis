package com.example.workflow.service;

import com.example.workflow.model.Role;
import com.example.workflow.model.TopUserDTO;
import com.example.workflow.model.User;
import com.example.workflow.model.User.UserStatus;
import com.example.workflow.repository.OrderRepository;
import com.example.workflow.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    private OrderRepository orderRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(Role.USER);
        user.setStatus(UserStatus.ACTIVE);
        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với email: " + email));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            throw new IllegalArgumentException("Mật khẩu không được để trống");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public Optional<User> getUserById(String userId) {
        return userRepository.findById(userId);
    }

    @Transactional
    public User updateUser(String userId, User updatedUser) {
        return userRepository.findById(userId).map(user -> {
            user.setFullName(updatedUser.getFullName());
            user.setEmail(updatedUser.getEmail());
            if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
                user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
            }
            user.setRole(updatedUser.getRole());
            user.setStatus(updatedUser.getStatus()); // Thêm dòng này để cập nhật status
            return userRepository.save(user);
        }).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));
    }

    @Transactional
    public User deleteUser(String userId) { // Thay đổi để trả về User
        return userRepository.findById(userId).map(user -> {
            user.setStatus(UserStatus.BANNED);
            return userRepository.save(user);
        }).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));
    }

    @Transactional
    public User restoreUser(String userId) { // Thay đổi để trả về User
        return userRepository.findById(userId).map(user -> {
            user.setStatus(UserStatus.ACTIVE);
            return userRepository.save(user);
        }).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));
    }

    public User getUserByEmail(String name) {
        return userRepository.findByEmail(name).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với email: " + name));
    }


    public List<TopUserDTO> getTop3UsersBySpending() {
        List<Object[]> results = orderRepository.findTop3UsersBySpending();

        return results.stream().limit(3).map(result -> {
            User user = (User) result[0];
            Double totalSpent = (Double) result[1];
            return new TopUserDTO(user.getUserId(), user.getFullName(), user.getEmail(), totalSpent);
        }).collect(Collectors.toList());
    }
}