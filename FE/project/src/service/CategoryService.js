import axios from 'axios';
import Cookies from 'js-cookie';

// Base URL của backend
const API_URL = 'http://localhost:8080/api/categories';

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
            console.log('No token found, request may fail if authentication is required');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const CategoryService = {
    // ✅ Lấy tất cả danh mục (chỉ hiển thị danh mục active) - Công khai
    getAllCategories: async () => {
        try {
            const response = await axios.get(API_URL); // Sử dụng axios trực tiếp vì permitAll
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách danh mục:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // ✅ Lấy danh mục theo ID - Công khai
    getCategoryById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`); // Sử dụng axios trực tiếp vì permitAll
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi lấy danh mục với ID ${id}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // ✅ Lấy danh mục theo tên - Công khai
    getCategoryByName: async (name) => {
        try {
            const response = await axios.get(`${API_URL}/name/${name}`); // Sử dụng axios trực tiếp vì permitAll
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi lấy danh mục với tên ${name}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // ✅ Thêm danh mục mới - Yêu cầu ADMIN
    createCategory: async (categoryData) => {
        try {
            const response = await axiosInstance.post('', categoryData); // Sử dụng axiosInstance vì cần token
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tạo danh mục:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // ✅ Cập nhật danh mục - Yêu cầu ADMIN
    updateCategory: async (id, updatedData) => {
        try {
            const response = await axiosInstance.put(`/${id}`, updatedData); // Sử dụng axiosInstance vì cần token
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi cập nhật danh mục với ID ${id}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // ✅ Vô hiệu hóa danh mục (chuyển trạng thái thành "inactive") - Yêu cầu ADMIN
    disableCategory: async (id) => {
        try {
            const response = await axiosInstance.put(`/${id}/disable`); // Sử dụng axiosInstance vì cần token
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi vô hiệu hóa danh mục với ID ${id}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // ✅ Khôi phục danh mục (chuyển trạng thái thành "active") - Yêu cầu ADMIN
    restoreCategory: async (id) => {
        try {
            const response = await axiosInstance.put(`/${id}/restore`); // Sử dụng axiosInstance vì cần token
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi khôi phục danh mục với ID ${id}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // ✅ Lấy tên danh mục theo ID - Công khai
    getCategoryNameById: async (categoryId) => {
        try {
            const response = await axios.get(`${API_URL}/${categoryId}/name`); // Sử dụng axios trực tiếp vì permitAll
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi lấy tên danh mục với ID ${categoryId}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
};

export default CategoryService;