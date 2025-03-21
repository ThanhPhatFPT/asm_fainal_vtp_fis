import axios from 'axios';
import Cookies from 'js-cookie';

// Base URL của backend
const API_URL = 'http://localhost:8080/api/users';

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
            console.log('No token found in cookies');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const userService = {
    // Lấy danh sách tất cả người dùng (không cần token vì permitAll)
    getAllUsers: async () => {
        try {
            const response = await axios.get(API_URL); // Sử dụng axios trực tiếp vì công khai
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách người dùng:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // Lấy thông tin người dùng theo ID (không cần token vì permitAll)
    getUserById: async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/${userId}`); // Sử dụng axios trực tiếp vì công khai
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi lấy người dùng ID ${userId}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // Tạo người dùng mới (yêu cầu vai trò ADMIN)
    createUser: async (userData) => {
        try {
            const response = await axiosInstance.post('/create', userData); // Sử dụng axiosInstance vì cần token
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tạo người dùng:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // Cập nhật thông tin người dùng (yêu cầu vai trò ADMIN)
    updateUser: async (userId, updatedData) => {
        try {
            const response = await axiosInstance.put(`/${userId}`, updatedData); // Sử dụng axiosInstance vì cần token
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi cập nhật người dùng ID ${userId}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // Khóa người dùng (yêu cầu vai trò ADMIN)
    deleteUser: async (userId) => {
        try {
            const response = await axiosInstance.put(`/${userId}/status/banned`); // Sử dụng axiosInstance vì cần token
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi khóa người dùng ID ${userId}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // Khôi phục người dùng (yêu cầu vai trò ADMIN)
    restoreUser: async (userId) => {
        try {
            const response = await axiosInstance.put(`/${userId}/restore`); // Sử dụng axiosInstance vì cần token
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi khôi phục người dùng ID ${userId}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
};

export default userService;