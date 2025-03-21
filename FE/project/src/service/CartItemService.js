import axios from 'axios';
import Cookies from 'js-cookie';

// Base URL từ biến môi trường hoặc mặc định
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/cart';

// Tạo instance axios với cấu hình mặc định
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor để thêm token vào header
axiosInstance.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        if (!token) {
            throw new Error('No token found. Please log in as a USER.');
        }
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Request URL:', config.url, 'Token:', token); // Debug log
        return config;
    },
    (error) => Promise.reject(error)
);

// Xử lý lỗi chung
const handleError = (error) => {
    if (error.response) {
        const message = error.response.data?.message || 'Đã xảy ra lỗi từ server.';
        if (error.response.status === 403) {
            return new Error('Bạn không có quyền truy cập giỏ hàng này. Vui lòng kiểm tra vai trò hoặc đăng nhập lại.');
        }
        throw new Error(message);
    } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
    } else {
        throw new Error(error.message || 'Đã xảy ra lỗi không xác định.');
    }
};

const CartItemService = {
    getCartItemsByUser: async (userId) => {
        try {
            const response = await axiosInstance.get(`/${userId}`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    addToCart: async (userId, productId, quantity) => {
        try {
            const response = await axiosInstance.post(`/${userId}/add/${productId}`, null, {
                params: { quantity },
            });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    updateQuantity: async (cartItemId, quantity) => {
        try {
            const response = await axiosInstance.put(`/${cartItemId}/update`, null, {
                params: { quantity },
            });
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    removeFromCart: async (cartItemId) => {
        try {
            await axiosInstance.delete(`/${cartItemId}/remove`);
        } catch (error) {
            throw handleError(error);
        }
    },

    clearCart: async (userId) => {
        try {
            await axiosInstance.delete(`/${userId}/clear`);
        } catch (error) {
            throw handleError(error);
        }
    },
};

export default CartItemService;