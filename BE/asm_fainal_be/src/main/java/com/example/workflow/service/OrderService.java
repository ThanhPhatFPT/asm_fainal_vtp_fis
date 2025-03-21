package com.example.workflow.service;

import com.example.workflow.dto.OrderDTO;
import com.example.workflow.model.*;
import com.example.workflow.repository.*;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.task.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskService taskService;

    @Autowired
    private RuntimeService runtimeService;

    public OrderService(OrderRepository orderRepository, CartItemRepository cartItemRepository,
                        OrderDetailRepository orderDetailRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderDetailRepository = orderDetailRepository;
        this.productRepository = productRepository;
    }

    // Tạo đơn hàng
    @Transactional
    public Order createOrder(User user) {
        List<CartItem> cartItems = cartItemRepository.findByUser(user);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Giỏ hàng trống!");
        }

        Order order = new Order();
        order.setUser(user);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(Order.OrderStatus.CHỜ_XÁC_NHẬN);
        order.setPaymentStatus(Order.PaymentStatus.CHƯA_THANH_TOÁN);

        double totalAmount = 0.0;
        for (CartItem item : cartItems) {
            if (item.getProduct().getQuantity() < item.getQuantity()) {
                throw new RuntimeException("Sản phẩm " + item.getProduct().getName() + " không đủ hàng!");
            }

            OrderDetail orderDetail = new OrderDetail();
            orderDetail.setOrder(order);
            orderDetail.setProduct(item.getProduct());
            orderDetail.setQuantity(item.getQuantity());
            orderDetail.setPrice(item.getProduct().getPrice());
            orderDetail.setOriginalPrice(item.getProduct().getPrice());
            orderDetail.setDiscount(item.getProduct().getDiscount());

            totalAmount += (item.getProduct().getPrice() - item.getProduct().getDiscount()) * item.getQuantity();
            order.getOrderDetails().add(orderDetail);

            item.getProduct().setQuantity(item.getProduct().getQuantity() - item.getQuantity());
            productRepository.save(item.getProduct());
        }

        order.setTotalAmount(totalAmount);
        orderRepository.save(order);

        cartItemRepository.deleteAll(cartItems);

        // Khởi tạo quy trình Camunda ngay sau khi tạo đơn hàng thành công
        startCamundaProcess(order.getId());

        return order;
    }


    // Khởi tạo quy trình Camunda
    private void startCamundaProcess(UUID orderId) {
        runtimeService.startProcessInstanceByKey(
                "asm_fainal_be-process",
                orderId.toString(),
                Map.of("orderId", orderId.toString())
        );
    }

    // Quản trị viên cập nhật trạng thái đơn hàng
    @Transactional
    public OrderDTO updateOrderStatus(UUID orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng!"));

        Order.OrderStatus newStatus;
        try {
            newStatus = Order.OrderStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }

        Order.OrderStatus currentStatus = order.getStatus();
        completeCurrentTask(orderId, currentStatus, newStatus);

        return new OrderDTO(order);
    }

    // Hoàn thành task hiện tại trong Camunda
    private void completeCurrentTask(UUID orderId, Order.OrderStatus currentStatus, Order.OrderStatus newStatus) {
        List<Task> tasks = taskService.createTaskQuery()
                .processInstanceBusinessKey(orderId.toString())
                .processDefinitionKey("asm_fainal_be-process")
                .active()
                .list();

        if (tasks.isEmpty()) {
            return; // Quy trình chưa bắt đầu hoặc đã kết thúc
        }

        Task task = tasks.get(0);
        String taskDefinitionKey = task.getTaskDefinitionKey();

        switch (taskDefinitionKey) {
            case "Activity_1q497ee": // Xác nhận đơn hàng
                if (newStatus == Order.OrderStatus.CHỜ_LẤY_HÀNG) {
                    taskService.complete(task.getId()); // Không cần stockAvailable
                }
                break;

            case "Activity_1q497eh": // Chuẩn bị hàng
                if (newStatus == Order.OrderStatus.CHỜ_GIAO_HÀNG) {
                    taskService.setVariable(task.getId(), "cancelOrder", false);
                    taskService.complete(task.getId());
                } else if (newStatus == Order.OrderStatus.ĐÃ_HỦY) {
                    taskService.setVariable(task.getId(), "cancelOrder", true);
                    taskService.complete(task.getId());
                }
                break;

            case "Activity_1ti5j3l": // Chờ giao hàng
                if (newStatus == Order.OrderStatus.ĐÃ_GIAO) {
                    taskService.setVariable(task.getId(), "deliverySuccess", true);
                    taskService.complete(task.getId());
                } else if (newStatus == Order.OrderStatus.ĐÃ_HỦY) {
                    taskService.setVariable(task.getId(), "deliverySuccess", false);
                    taskService.complete(task.getId());
                }
                break;

            case "Activity_1noutv2": // Giao hàng thành công
                if (newStatus == Order.OrderStatus.ĐÃ_GIAO) {
                    taskService.complete(task.getId());
                }
                break;

            default:
                throw new RuntimeException("Task không được hỗ trợ: " + taskDefinitionKey);
        }
    }

    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAll().stream().map(OrderDTO::new).collect(Collectors.toList());
    }

    public List<OrderDTO> getOrdersByUser(User user) {
        return orderRepository.findByUser(user).stream().map(OrderDTO::new).collect(Collectors.toList());
    }

    public OrderDTO getOrderById(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng!"));
        return new OrderDTO(order);
    }

    @Transactional
    public OrderDTO cancelOrder(UUID orderId, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng!"));
        if (!order.getUser().equals(user)) {
            throw new RuntimeException("Bạn không có quyền hủy đơn hàng này!");
        }
        return setOrderToCancelled(orderId);
    }

    public List<OrderDTO> getOrdersByUserId(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
        return getOrdersByUser(user);
    }


    @Transactional
    public OrderDTO setOrderToWaitingPickup(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng!"));
        if (order.getStatus() != Order.OrderStatus.CHỜ_XÁC_NHẬN) {
            throw new RuntimeException("Đơn hàng phải ở trạng thái CHỜ_XÁC_NHẬN để chuyển sang CHỜ_LẤY_HÀNG!");
        }

        // Tìm task Activity_1q497ee (Xác nhận đơn hàng)
        List<Task> tasks = taskService.createTaskQuery()
                .processInstanceBusinessKey(orderId.toString())
                .taskDefinitionKey("Activity_1q497ee")
                .active()
                .list();

        if (tasks.isEmpty()) {
            throw new RuntimeException("Không tìm thấy task Xác nhận đơn hàng!");
        }

        Task task = tasks.get(0);

        // Kiểm tra tồn kho (stockAvailable)
        boolean stockAvailable = true;
        for (OrderDetail detail : order.getOrderDetails()) {
            if (detail.getProduct().getQuantity() < detail.getQuantity()) {
                stockAvailable = false;
                break;
            }
        }

        // Gán giá trị stockAvailable cho task trước khi hoàn thành
        taskService.setVariable(task.getId(), "stockAvailable", stockAvailable);
        taskService.complete(task.getId()); // Hoàn thành task, Camunda sẽ xử lý Gateway_1r9z8bm

        // Kiểm tra trạng thái sau khi hoàn thành task
        tasks = taskService.createTaskQuery()
                .processInstanceBusinessKey(orderId.toString())
                .active()
                .list();

        if (tasks.isEmpty()) {
            // Nếu không còn task, quy trình đã kết thúc (hủy do stockAvailable = false)
            order.setStatus(Order.OrderStatus.ĐÃ_HỦY);
            for (OrderDetail detail : order.getOrderDetails()) {
                Product product = detail.getProduct();
                product.setQuantity(product.getQuantity() + detail.getQuantity());
                productRepository.save(product);
            }
        } else if (tasks.get(0).getTaskDefinitionKey().equals("Activity_1q497eh")) {
            // Nếu đến Activity_1q497eh, cập nhật trạng thái thành CHỜ_LẤY_HÀNG
            order.setStatus(Order.OrderStatus.CHỜ_LẤY_HÀNG);
        } else {
            throw new RuntimeException("Quy trình không chuyển đến trạng thái mong muốn sau khi xác nhận!");
        }

        orderRepository.save(order);
        return new OrderDTO(order);
    }

    @Transactional
    public OrderDTO setOrderToWaitingDelivery(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng!"));
        if (order.getStatus() != Order.OrderStatus.CHỜ_LẤY_HÀNG) {
            throw new RuntimeException("Đơn hàng phải ở trạng thái CHỜ_LẤY_HÀNG để chuyển sang CHỜ_GIAO_HÀNG!");
        }

        List<Task> tasks = taskService.createTaskQuery()
                .processInstanceBusinessKey(orderId.toString())
                .taskDefinitionKey("Activity_1q497eh")
                .active()
                .list();

        if (tasks.isEmpty()) {
            throw new RuntimeException("Không tìm thấy task Chuẩn bị hàng!");
        }

        Task task = tasks.get(0);
        taskService.setVariable(task.getId(), "cancelOrder", false);
        taskService.complete(task.getId());

        order.setStatus(Order.OrderStatus.CHỜ_GIAO_HÀNG);
        orderRepository.save(order);
        return new OrderDTO(order);
    }

    @Transactional
    public OrderDTO setOrderToDelivered(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng!"));
        if (order.getStatus() != Order.OrderStatus.CHỜ_GIAO_HÀNG) {
            throw new RuntimeException("Đơn hàng phải ở trạng thái CHỜ_GIAO_HÀNG để chuyển sang ĐÃ_GIAO!");
        }

        List<Task> tasks = taskService.createTaskQuery()
                .processInstanceBusinessKey(orderId.toString())
                .taskDefinitionKey("Activity_1ti5j3l")
                .active()
                .list();

        if (tasks.isEmpty()) {
            throw new RuntimeException("Không tìm thấy task Chờ giao hàng!");
        }

        Task task = tasks.get(0);
        taskService.setVariable(task.getId(), "deliverySuccess", true);
        taskService.complete(task.getId());

        order.setStatus(Order.OrderStatus.ĐÃ_GIAO);
        order.setPaymentStatus(Order.PaymentStatus.ĐÃ_THANH_TOÁN);
        orderRepository.save(order);

        return new OrderDTO(order);
    }

    @Transactional
    public OrderDTO confirmOrderDelivered(UUID orderId, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng!"));
        if (order.getStatus() != Order.OrderStatus.ĐÃ_GIAO) {
            throw new RuntimeException("Đơn hàng phải ở trạng thái ĐÃ_GIAO để xác nhận!");
        }
        if (!order.getUser().equals(user)) {
            throw new RuntimeException("Bạn không có quyền xác nhận đơn hàng này!");
        }

        List<Task> tasks = taskService.createTaskQuery()
                .processInstanceBusinessKey(orderId.toString())
                .taskDefinitionKey("Activity_1noutv2")
                .active()
                .list();

        if (tasks.isEmpty()) {
            throw new RuntimeException("Không tìm thấy task Giao hàng thành công!");
        }

        Task task = tasks.get(0);
        taskService.complete(task.getId());

        return new OrderDTO(order);
    }



    @Transactional
    public OrderDTO setOrderToCancelled(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng!"));

        if (order.getStatus() == Order.OrderStatus.ĐÃ_GIAO ||
                order.getStatus() == Order.OrderStatus.ĐÃ_HỦY) {
            throw new RuntimeException("Không thể hủy đơn hàng đã giao hoặc đã hủy!");
        }

        List<Task> tasks = taskService.createTaskQuery()
                .processInstanceBusinessKey(orderId.toString())
                .active()
                .list();

        if (tasks.isEmpty()) {
            // Direct cancellation if process hasn't started
            order.setStatus(Order.OrderStatus.ĐÃ_HỦY);
            restoreStock(order);
            orderRepository.save(order);
        } else {
            Task currentTask = tasks.get(0);
            String taskDefinitionKey = currentTask.getTaskDefinitionKey();

            switch (taskDefinitionKey) {
                case "Activity_1q497ee": // Xác nhận đơn hàng
                    taskService.setVariable(currentTask.getId(), "stockAvailable", false);
                    taskService.complete(currentTask.getId());
                    // Quy trình sẽ tự động chạy đến Activity_00kxg4m (Hủy đơn hàng) trong BPMN
                    break;

                case "Activity_1q497eh": // Chuẩn bị hàng
                    taskService.setVariable(currentTask.getId(), "cancelOrder", true); // Điều chỉnh để hủy
                    taskService.complete(currentTask.getId());
                    // Quy trình sẽ chạy đến Activity_10ex0t7 (Hủy đơn hàng) trong BPMN
                    break;

                case "Activity_1ti5j3l": // Chờ giao hàng
                    taskService.setVariable(currentTask.getId(), "deliverySuccess", false);
                    taskService.complete(currentTask.getId());
                    // Quy trình sẽ chạy đến Activity_11bgzqx (Không nhận hàng) trong BPMN
                    break;

                default:
                    throw new RuntimeException("Không thể hủy từ trạng thái hiện tại: " + taskDefinitionKey);
            }

            // Đợi quy trình BPMN hoàn thành và cập nhật trạng thái đơn hàng
            order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng sau khi hủy!"));
            if (order.getStatus() != Order.OrderStatus.ĐÃ_HỦY) {
                // Nếu quy trình chưa tự động hủy, ép trạng thái hủy
                handleCancellationOutcome(order);
            }
        }

        // Trả về trạng thái đơn hàng sau khi hủy
        return new OrderDTO(order);
    }



    // Helper method to restore stock
    private void restoreStock(Order order) {
        for (OrderDetail detail : order.getOrderDetails()) {
            Product product = detail.getProduct();
            product.setQuantity(product.getQuantity() + detail.getQuantity());
            productRepository.save(product);
        }
    }

    // Helper method to handle cancellation outcome
    private void handleCancellationOutcome(Order order) {
        order.setStatus(Order.OrderStatus.ĐÃ_HỦY);
        restoreStock(order);
        orderRepository.save(order);
    }



    // Tính tổng doanh thu
    public Double getTotalRevenue() {
        Double totalRevenue = orderRepository.getTotalRevenue();
        return totalRevenue != null ? totalRevenue : 0.0;
    }

    // Tính tổng số đơn hàng
    public Long getTotalOrders() {
        Long totalOrders = orderRepository.getTotalOrders();
        return totalOrders != null ? totalOrders : 0L;
    }

    // Tính giá trị đơn trung bình
    public Double getAverageOrderValue() {
        Double averageOrderValue = orderRepository.getAverageOrderValue();
        return averageOrderValue != null ? averageOrderValue : 0.0;
    }

    // Thêm phương thức đếm số lượng user đã đặt hàng
    public Long getUniqueUserCount() {
        return orderRepository.countDistinctUsers();
    }
}