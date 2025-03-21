package com.example.workflow.service;

import com.example.workflow.model.Product;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProductReportService {

    public byte[] generateProductReport(List<Product> products, String format) throws JRException {
        // Load JRXML template
        InputStream reportTemplate = getClass().getResourceAsStream("/reports/product_report.jrxml");

        // Compile report
        JasperReport jasperReport = JasperCompileManager.compileReport(reportTemplate);

        // Prepare parameters
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("ReportTitle", "Product List Report - " + java.time.LocalDate.now());

        // Create data source from product list
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(products);

        // Fill report
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        // Export based on format
        if ("excel".equalsIgnoreCase(format)) {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JRXlsxExporter exporter = new JRXlsxExporter();
            exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
            exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(outputStream));
            // Không cần cấu hình phức tạp nếu chỉ cần xuất cơ bản
            exporter.exportReport();
            return outputStream.toByteArray();
        } else {
            // Default to PDF
            return JasperExportManager.exportReportToPdf(jasperPrint);
        }
    }
}