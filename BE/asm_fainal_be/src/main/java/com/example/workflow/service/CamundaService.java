package com.example.workflow.service;

import com.example.workflow.model.Order;
import com.example.workflow.model.OrderDetail;
import com.example.workflow.model.Product;
import com.example.workflow.repository.OrderRepository;
import com.example.workflow.repository.ProductRepository;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service("orderServiceTask") // Đảm bảo khớp với delegateExpression trong BPMN
public class CamundaService implements JavaDelegate {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Override
    @Transactional
    public void execute(DelegateExecution execution) throws Exception {
        // Lấy orderId từ biến quy trình
        String orderIdStr = (String) execution.getVariable("orderId");
        if (orderIdStr == null) {
            throw new IllegalArgumentException("orderId is not set in process variables!");
        }
        UUID orderId = UUID.fromString(orderIdStr);

        // Tìm đơn hàng
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy đơn hàng với ID: " + orderId));

        // Lấy task hiện tại từ activity ID
        String taskDefinitionKey = execution.getCurrentActivityId();

        // Xử lý theo từng serviceTask trong BPMN
        switch (taskDefinitionKey) {
            case "Activity_00kxg4m": // Hủy đơn hàng khi không có hàng trong kho
            case "Activity_10ex0t7": // Hủy đơn hàng khi không tiếp tục sau chuẩn bị
            case "Activity_11bgzqx": // Hủy đơn hàng khi giao hàng thất bại
                cancelOrder(order);
                execution.setVariable("orderStatus", order.getStatus().name());
                break;
            default:
                throw new IllegalStateException("Không hỗ trợ task: " + taskDefinitionKey);
        }
    }

    // Phương thức hủy đơn hàng và khôi phục kho
    private void cancelOrder(Order order) {
        // Kiểm tra trạng thái đơn hàng
        if (order.getStatus() == Order.OrderStatus.ĐÃ_GIAO || order.getStatus() == Order.OrderStatus.ĐÃ_HỦY) {
            throw new IllegalStateException("Không thể hủy đơn hàng đã giao hoặc đã hủy!");
        }

        // Cập nhật trạng thái và khôi phục kho
        order.setStatus(Order.OrderStatus.ĐÃ_HỦY);
        for (OrderDetail detail : order.getOrderDetails()) {
            Product product = detail.getProduct();
            product.setQuantity(product.getQuantity() + detail.getQuantity());
            productRepository.save(product);
        }
        orderRepository.save(order);
    }
}