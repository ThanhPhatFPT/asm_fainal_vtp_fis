package com.example.workflow.controller;

import com.example.workflow.dto.AuthRequest;
import com.example.workflow.dto.AuthResponse;
import com.example.workflow.dto.RegisterRequest;
import com.example.workflow.dto.UpdateProfileRequest;
import com.example.workflow.model.Role;
import com.example.workflow.model.User;
import com.example.workflow.service.EmailService;
import com.example.workflow.service.JwtService;
import com.example.workflow.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    // Lưu trữ mã xác nhận tạm thời trong bộ nhớ (HashMap)
    private final Map<String, ResetCode> resetCodes = new HashMap<>();

    // Lớp để lưu thông tin mã xác nhận
    private static class ResetCode {
        private final String code;
        private final String email;
        private final LocalDateTime expiryDate;

        public ResetCode(String code, String email) {
            this.code = code;
            this.email = email;
            this.expiryDate = LocalDateTime.now().plusMinutes(15); // Hết hạn sau 15 phút
        }

        public String getCode() {
            return code;
        }

        public String getEmail() {
            return email;
        }

        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiryDate);
        }
    }

    // Tạo mã xác nhận ngẫu nhiên (6 chữ số)
    private String generateResetCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // Tạo số ngẫu nhiên từ 100000 đến 999999
        return String.valueOf(code);
    }

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

    // ✅ Đăng nhập
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

    // ✅ Cập nhật hồ sơ
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateProfileRequest request) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Token không hợp lệ hoặc thiếu"));
            }
            String token = authHeader.substring(7);
            String email = jwtService.extractUsername(token);

            UserDetails userDetails = userService.findByEmail(email);
            if (!jwtService.validateToken(token, userDetails)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Token không hợp lệ hoặc đã hết hạn"));
            }

            // Lấy role từ token
            String role = jwtService.extractRole(token); // Giả sử JwtService có phương thức extractRole
            boolean isAdmin = "ROLE_ADMIN".equals(role);

            // Kiểm tra quyền
            User currentUser = userService.findByEmail(email);
            if (!isAdmin && !currentUser.getEmail().equals(request.getEmail())) {
                // Nếu không phải ADMIN và cố gắng cập nhật email của người khác
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Bạn không có quyền cập nhật hồ sơ của người khác"));
            }

            if (request.getRole() != null && !isAdmin) {
                // Chỉ ADMIN mới được thay đổi role
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Bạn không có quyền thay đổi vai trò"));
            }

            User updatedUser = userService.updateUserProfile(email, request);
            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật hồ sơ thành công!",
                    "user", Map.of(
                            "userId", updatedUser.getUserId(),
                            "email", updatedUser.getEmail(),
                            "fullName", updatedUser.getFullName(),
                            "role", updatedUser.getRole().name() // Trả về role
                    )
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Cập nhật hồ sơ thất bại: " + e.getMessage()));
        }
    }

    // ✅ Quên mật khẩu (không yêu cầu đăng nhập)
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        User user = userService.findByEmail(email);

        Map<String, String> response = new HashMap<>();
        if (user == null) {
            response.put("message", "Email không tồn tại!");
            return ResponseEntity.badRequest().body(response);
        }

        // Tạo mã xác nhận
        String resetCode = generateResetCode();

        // Lưu mã xác nhận vào HashMap
        resetCodes.put(email, new ResetCode(resetCode, email));

        // Gửi email chứa mã xác nhận
        try {
            emailService.sendPasswordResetCodeEmail(email, resetCode);
            response.put("message", "Mã xác nhận đã được gửi qua email!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Lỗi khi gửi email: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // ✅ Đặt lại mật khẩu (không yêu cầu đăng nhập)
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");

        Map<String, String> response = new HashMap<>();

        // Kiểm tra mã xác nhận
        ResetCode resetCode = resetCodes.get(email);
        if (resetCode == null) {
            response.put("message", "Mã xác nhận không tồn tại!");
            return ResponseEntity.badRequest().body(response);
        }

        if (resetCode.isExpired()) {
            resetCodes.remove(email); // Xóa mã đã hết hạn
            response.put("message", "Mã xác nhận đã hết hạn!");
            return ResponseEntity.badRequest().body(response);
        }

        if (!resetCode.getCode().equals(code)) {
            response.put("message", "Mã xác nhận không đúng!");
            return ResponseEntity.badRequest().body(response);
        }

        // Cập nhật mật khẩu mới
        User user = userService.findByEmail(email);
        if (user == null) {
            response.put("message", "Người dùng không tồn tại!");
            return ResponseEntity.badRequest().body(response);
        }

        // Cập nhật mật khẩu
        user.setPassword(passwordEncoder.encode(newPassword));
        userService.save(user); // Lưu user với mật khẩu mới

        // Xóa mã xác nhận sau khi sử dụng
        resetCodes.remove(email);

        response.put("message", "Đặt lại mật khẩu thành công!");
        return ResponseEntity.ok(response);
    }
}