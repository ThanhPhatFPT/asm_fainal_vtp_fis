package com.example.workflow.controller;

import com.example.workflow.model.TopUserDTO;
import com.example.workflow.model.User;
import com.example.workflow.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<User> getUserById(@PathVariable("userId") String userId) {
        Optional<User> user = userService.getUserById(userId);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            User newUser = userService.createUser(user);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Tạo mới người dùng thành công");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable("userId") String userId, @RequestBody User user) {
        try {
            User updatedUser = userService.updateUser(userId, user);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{userId}/status/banned")
    public ResponseEntity<User> banUser(@PathVariable("userId") String userId) {
        try {
            User bannedUser = userService.deleteUser(userId);
            return ResponseEntity.ok(bannedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{userId}/restore")
    public ResponseEntity<User> restoreUser(@PathVariable("userId") String userId) {
        try {
            User restoredUser = userService.restoreUser(userId);
            return ResponseEntity.ok(restoredUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/top-spenders")
    public List<TopUserDTO> getTop3UsersBySpending() {
        return userService.getTop3UsersBySpending();
    }
}