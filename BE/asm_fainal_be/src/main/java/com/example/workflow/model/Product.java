package com.example.workflow.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // UUID tự sinh
    private UUID id;


    @PrePersist
    public void generateUUID() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

    @Column(nullable = false, unique = true) // Đảm bảo tên sản phẩm là duy nhất
    private String name;
    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Double discount; // Giảm giá (phần trăm hoặc số tiền giảm)

    private String description;

    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    private List<String> imageUrls; // Danh sách ảnh

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status; // Trạng thái sản phẩm



    public enum ProductStatus {
        ACTIVE,       // Sản phẩm đang hoạt động
        INACTIVE,     // Sản phẩm không hoạt động
        OUT_OF_STOCK, // Hết hàng
        DISCONTINUED  // Ngừng kinh doanh
    }
}
