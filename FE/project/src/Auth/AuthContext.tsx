// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface AuthContextType {
    userId: string | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userId, setUserId] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const navigate = useNavigate();

    // Khởi tạo trạng thái từ token khi tải ứng dụng
    useEffect(() => {
        const token = Cookies.get("token");
        if (token) {
            try {
                const decodedToken: any = jwtDecode(token);
                setUserId(decodedToken.userId);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Lỗi khi giải mã token:", error);
                logout();
            }
        }
    }, []);

    const login = (token: string) => {
        Cookies.set("token", token, { expires: 7 }); // Lưu token trong 7 ngày
        const decodedToken: any = jwtDecode(token);
        setUserId(decodedToken.userId);
        setIsAuthenticated(true);
    };

    const logout = () => {
        Cookies.remove("token");
        setUserId(null);
        setIsAuthenticated(false);
        toast.warn("Bạn đã bị đăng xuất!", { autoClose: 2000 });
        navigate("/login");
    };

    return (
        <AuthContext.Provider value={{ userId, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook để sử dụng AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth phải được sử dụng trong AuthProvider");
    }
    return context;
};