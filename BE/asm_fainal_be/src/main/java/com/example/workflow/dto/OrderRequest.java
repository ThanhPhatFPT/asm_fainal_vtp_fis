package com.example.workflow.dto;

import java.util.List;

public class OrderRequest {
    private List<String> cartItemIds;

    public List<String> getCartItemIds() {
        return cartItemIds;
    }

    public void setCartItemIds(List<String> cartItemIds) {
        this.cartItemIds = cartItemIds;
    }
}