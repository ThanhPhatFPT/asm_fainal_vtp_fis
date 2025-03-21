package com.example.workflow.controller;

import com.example.workflow.dto.AuthRequest;
import com.example.workflow.dto.AuthResponse;
import com.example.workflow.dto.RegisterRequest;
import com.example.workflow.model.Role;
import com.example.workflow.model.User;
import com.example.workflow.service.JwtService;
import com.example.workflow.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "localhost:5173")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager, UserService userService, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    // ✅ Đăng ký tài khoản
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPassword(request.getPassword());  // Không cần encode ở đây
        newUser.setFullName(request.getFullName());
        newUser.setRole(request.getRole() != null ? request.getRole() : Role.USER);
        newUser.setStatus(User.UserStatus.ACTIVE);
        userService.registerUser(newUser);  // Lưu user vào DB
        return ResponseEntity.ok(Map.of("message", "Đăng ký thành công!"));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        try {
            // Xác thực thông tin đăng nhập
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            // Lấy user từ database
            User user = userService.findByEmail(request.getEmail());

            // Kiểm tra nếu user không tồn tại
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new AuthResponse("Người dùng không tồn tại"));
            }

            // Kiểm tra trạng thái user
            switch (user.getStatus()) {
                case ACTIVE:
                    // Tạo token nếu trạng thái là ACTIVE
                    String token = jwtService.generateToken(user);
                    return ResponseEntity.ok(new AuthResponse(token, "Đăng nhập thành công"));
                case INACTIVE:
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(new AuthResponse("Tài khoản chưa được kích hoạt"));
                case BANNED:
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(new AuthResponse("Tài khoản đã bị khóa"));
                default:
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new AuthResponse("Trạng thái tài khoản không hợp lệ"));
            }

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse("Thông tin đăng nhập không hợp lệ"));
        }
    }

    // ✅ Kiểm tra token hợp lệ
    @GetMapping("/validate")
    public ResponseEntity<Boolean> validateToken(@RequestParam String token) {
        String email = jwtService.extractUsername(token);
        UserDetails userDetails = userService.findByEmail(email);
        boolean isValid = jwtService.validateToken(token, userDetails);
        return ResponseEntity.ok(isValid);
    }
}
