import axios from 'axios';
import Cookies from 'js-cookie';

// Base URL từ biến môi trường hoặc mặc định
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/products';

// Hàm lấy token từ Cookies
const getAuthToken = () => {
    return Cookies.get('token');
};

// Cấu hình Axios với header Authorization cho các yêu cầu cần xác thực
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
            console.log('No token found in cookies');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const ProductService = {
    // ✅ Lấy tất cả sản phẩm - Công khai
    getAllProducts: (status) =>
        axios.get(API_URL, { params: { status } }).catch((error) => {
            throw error;
        }),
    getProductById: (id) =>
        axios.get(`${API_URL}/${id}`).catch((error) => {
            throw error;
        }),

    // ✅ Thêm sản phẩm mới - Yêu cầu ADMIN
    createProduct: async (data) => {
        try {
            const response = await axiosInstance.post('', data);
            return response.data;
        } catch (error) {
            console.error('Error creating product:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // ✅ Cập nhật sản phẩm - Yêu cầu ADMIN
    updateProduct: async (id, data) => {
        try {
            const response = await axiosInstance.put(`/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating product with ID ${id}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // ✅ Xóa sản phẩm - Yêu cầu ADMIN
    deleteProduct: async (id) => {
        try {
            const response = await axiosInstance.delete(`/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting product with ID ${id}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // ✅ Chuyển đổi trạng thái sản phẩm - Yêu cầu ADMIN
    toggleProductStatus: async (id) => {
        try {
            const response = await axiosInstance.patch(`/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            console.error(`Error toggling status of product with ID ${id}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 🌟 Lấy sản phẩm theo danh mục - Công khai
    getProductsByCategory: async (categoryId) => {
        try {
            const response = await axios.get(`${API_URL}/by-category/${categoryId}`);
            return response; // Return full response object
        } catch (error) {
            console.error(`Error fetching products by category ${categoryId}:`, error.response?.data || error.message);
            throw error;
        }
    },
};

export default ProductService;