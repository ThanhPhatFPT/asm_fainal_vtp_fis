import axios from 'axios';
import Cookies from 'js-cookie';

// Base URL của backend
const API_URL = 'http://localhost:8080/api/orders';

// Hàm lấy token từ Cookies
const getAuthToken = () => {
    return Cookies.get('token');
};

// Cấu hình Axios với header Authorization
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor để thêm token vào mọi request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Request URL:', config.url, 'Token:', token); // Debug log
        } else {
            console.log('No token found in cookies, request may fail');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const orderService = {
    // 1️⃣ Tạo đơn hàng - Yêu cầu ADMIN hoặc USER
    createOrder: async (orderRequest) => {
        try {
            const response = await axiosInstance.post('', orderRequest);
            return response.data;
        } catch (error) {
            console.error('Error creating order:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 2️⃣ Lấy danh sách đơn hàng của người dùng - Yêu cầu ADMIN hoặc USER
    getOrdersByUser: async () => {
        try {
            const response = await axiosInstance.get('/user');
            return response.data;
        } catch (error) {
            console.error('Error fetching user orders:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 3️⃣ Lấy chi tiết đơn hàng - Yêu cầu ADMIN hoặc USER
    getOrderById: async (orderId) => {
        try {
            const response = await axiosInstance.get(`/${orderId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching order details:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 4️⃣ Hủy đơn hàng (người dùng) - Yêu cầu USER (đã lỗi thời, thay bằng cancelOrderByUser)
    cancelOrder: async (orderId) => {
        try {
            const response = await axiosInstance.put(`/${orderId}/cancel-user`); // Thay bằng endpoint chính xác
            return response.data;
        } catch (error) {
            console.error('Error canceling order:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 5️⃣ Cập nhật trạng thái đơn hàng (dành cho admin) - Yêu cầu ADMIN
    updateOrderStatus: async (orderId, status) => {
        try {
            const response = await axiosInstance.put(`/${orderId}/status`, status, {
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating order status:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 6️⃣ Lấy tất cả đơn hàng (dành cho admin) - Yêu cầu ADMIN hoặc USER
    getAllOrders: async () => {
        try {
            const response = await axiosInstance.get('/getAll');
            return response.data;
        } catch (error) {
            console.error('Error fetching all orders:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 7️⃣ Lấy danh sách đơn hàng theo userId - Yêu cầu ADMIN hoặc USER
    getOrdersByUserId: async (userId) => {
        try {
            const response = await axiosInstance.get(`/user/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 8️⃣ Chuyển trạng thái sang CHỜ_LẤY_HÀNG - Yêu cầu ADMIN
    setOrderToWaitingPickup: async (orderId) => {
        try {
            const response = await axiosInstance.put(`/${orderId}/waiting-pickup`);
            return response.data;
        } catch (error) {
            console.error('Error setting order to waiting pickup:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 9️⃣ Chuyển trạng thái sang CHỜ_GIAO_HÀNG - Yêu cầu ADMIN
    setOrderToWaitingDelivery: async (orderId) => {
        try {
            const response = await axiosInstance.put(`/${orderId}/waiting-delivery`);
            return response.data;
        } catch (error) {
            console.error('Error setting order to waiting delivery:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 🔟 Chuyển trạng thái sang ĐÃ_GIAO - Yêu cầu ADMIN
    setOrderToDelivered: async (orderId) => {
        try {
            const response = await axiosInstance.put(`/${orderId}/delivered`);
            return response.data;
        } catch (error) {
            console.error('Error setting order to delivered:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 1️⃣1️⃣ Xác nhận giao hàng thành công - Yêu cầu ADMIN hoặc USER
    confirmOrderDelivered: async (orderId) => {
        try {
            const response = await axiosInstance.post(`/${orderId}/confirm-delivery`);
            return response.data;
        } catch (error) {
            console.error('Error confirming order delivery:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 1️⃣2️⃣ Hủy đơn hàng (dành cho admin) - Yêu cầu ADMIN
    cancelOrderByAdmin: async (orderId) => {
        try {
            const response = await axiosInstance.put(`/${orderId}/cancel-admin`);
            return response.data;
        } catch (error) {
            console.error('Error canceling order by admin:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 1️⃣3️⃣ Hủy đơn hàng (dành cho user với endpoint cancel-user) - Yêu cầu USER
    cancelOrderByUser: async (orderId) => {
        try {
            const response = await axiosInstance.put(`/${orderId}/cancel-user`);
            return response.data;
        } catch (error) {
            console.error('Error canceling order by user:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 1️⃣4️⃣ Lấy tổng doanh thu - Yêu cầu ADMIN hoặc USER
    getTotalRevenue: async () => {
        try {
            const response = await axiosInstance.get('/statistics/total-revenue');
            return response.data;
        } catch (error) {
            console.error('Error fetching total revenue:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 1️⃣5️⃣ Lấy tổng số đơn hàng - Yêu cầu ADMIN hoặc USER
    getTotalOrders: async () => {
        try {
            const response = await axiosInstance.get('/statistics/total-orders');
            return response.data;
        } catch (error) {
            console.error('Error fetching total orders:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 1️⃣6️⃣ Lấy giá trị đơn trung bình - Yêu cầu ADMIN hoặc USER
    getAverageOrderValue: async () => {
        try {
            const response = await axiosInstance.get('/statistics/average-order-value');
            return response.data;
        } catch (error) {
            console.error('Error fetching average order value:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 1️⃣7️⃣ Lấy số lượng user đã đặt hàng - Yêu cầu ADMIN hoặc USER
    getUniqueUserCount: async () => {
        try {
            const response = await axiosInstance.get('/statistics/total-unique-users');
            return response.data;
        } catch (error) {
            console.error('Error fetching unique user count:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
};

export default orderService;