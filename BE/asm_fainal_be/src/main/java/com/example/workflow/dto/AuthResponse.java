package com.example.workflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL) // Bỏ qua các trường null trong JSON
public class AuthResponse {
    private String token;
    private String email; // Không cần thiết trong trường hợp thành công mới
    private String role;  // Không cần thiết trong trường hợp thành công mới
    private String message;

    // Constructor cho trường hợp thành công (chỉ token và message)
    public AuthResponse(String token, String message) {
        this.token = token;
        this.message = message;
    }

    // Constructor cho trường hợp lỗi (chỉ message)
    public AuthResponse(String message) {
        this.message = message;
    }
}