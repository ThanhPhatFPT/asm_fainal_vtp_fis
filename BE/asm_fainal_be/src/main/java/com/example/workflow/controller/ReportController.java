package com.example.workflow.controller;

import com.example.workflow.model.Product;
import com.example.workflow.repository.ProductRepository;
import com.example.workflow.service.ProductReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ProductReportService productReportService;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<byte[]> exportProductReport(
            @RequestParam(value = "format", defaultValue = "pdf") String format) throws Exception {
        // Get all products
        List<Product> products = productRepository.findAll();

        // Generate report
        byte[] reportBytes = productReportService.generateProductReport(products, format);

        // Set headers to trigger file download dialog
        HttpHeaders headers = new HttpHeaders();
        String fileName;
        if ("excel".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            fileName = "products_report_" + java.time.LocalDate.now() + ".xlsx";
        } else {
            headers.setContentType(MediaType.APPLICATION_PDF);
            fileName = "products_report_" + java.time.LocalDate.now() + ".pdf";
        }
        headers.setContentDispositionFormData("attachment", fileName);
        headers.setContentLength(reportBytes.length);

        // Return response with file bytes
        return ResponseEntity.ok()
                .headers(headers)
                .body(reportBytes);
    }
}