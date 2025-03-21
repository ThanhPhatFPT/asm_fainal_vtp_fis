import axios from "axios";
import Cookies from "js-cookie";

const API_URL = "http://localhost:8080/api/auth"; // Đảm bảo đúng port backend

export const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { email, password });

        if (response.data.token) {
            Cookies.set("token", response.data.token, { expires: 7 });
            return response.data; // Trả về { token, message } khi thành công
        } else {
            // Nếu không có token, ném lỗi với message từ BE
            throw new Error(response.data.message || "Đăng nhập thất bại");
        }
    } catch (error) {
        // Ném lại lỗi với thông báo từ BE nếu có
        const errorMessage = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.";
        console.error("Lỗi đăng nhập:", error);
        throw new Error(errorMessage);
    }
};

export const register = async (fullName, email, password, phone) => {
    try {
        const response = await axios.post(`${API_URL}/register`, {
            fullName,
            email,
            password,
            phone,
            role: "USER" // Mặc định là USER
        });

        return response.data;
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        throw error;
    }
};

export const logout = () => {
    Cookies.remove("token");
};

export const getToken = () => {
    return Cookies.get("token");
};