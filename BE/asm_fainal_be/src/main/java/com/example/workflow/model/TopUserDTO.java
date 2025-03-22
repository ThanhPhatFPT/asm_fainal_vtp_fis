package com.example.workflow.model;

import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
public class TopUserDTO {
    private String userId;
    private String userName;
    private String email;
    private Double totalSpent;

    public TopUserDTO(String userId, String userName, String email, Double totalSpent) {
        this.userId = userId;
        this.userName = userName;
        this.email = email;
        this.totalSpent = totalSpent;
    }
}
