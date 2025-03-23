import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Key } from "lucide-react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const ResetPasswordPage: React.FC = () => {
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút tính bằng giây
    const [isExpired, setIsExpired] = useState(false);

    // Lấy email từ query params
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const email = queryParams.get("email") || location.state?.email || "";

    // Bộ đếm ngược
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setIsExpired(true);
        }
    }, [timeLeft]);

    // Chuyển đổi giây thành phút:giây
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
    };

    // Xử lý gửi yêu cầu đặt lại mật khẩu
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isExpired) {
            toast.error("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới!", {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:8080/api/auth/reset-password",
                { email, code: otp, newPassword }
            );

            toast.success(response.data.message, {
                position: "top-right",
                autoClose: 3000,
            });

            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.";
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    // Xử lý gửi lại mã OTP
    const handleResendCode = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                "http://localhost:8080/api/auth/forgot-password",
                { email }
            );

            toast.success(response.data.message, {
                position: "top-right",
                autoClose: 3000,
            });

            // Reset bộ đếm và trạng thái hết hạn
            setTimeLeft(15 * 60);
            setIsExpired(false);
            setOtp(""); // Xóa OTP cũ
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.";
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div className="min-h-screen flex items-center justify-center bg-gray-100">
            <motion.div className="max-w-md w-full bg-white shadow-lg rounded-xl p-6">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-red-600">Đặt lại mật khẩu</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Nhập mã OTP và mật khẩu mới để tiếp tục
                    </p>
                </div>

                <div className="mb-6 text-center">
                    <p className="text-sm text-gray-600">
                        Thời gian còn lại:{" "}
                        <span
                            className={`font-semibold ${
                                timeLeft <= 60 ? "text-red-600" : "text-green-600"
                            }`}
                        >
                            {formatTime(timeLeft)}
                        </span>
                    </p>
                    {isExpired && (
                        <p className="text-red-500 text-sm mt-2">
                            Mã OTP đã hết hạn!
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <motion.div className="mb-5">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Mã OTP
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all disabled:bg-gray-100"
                                placeholder="Nhập mã OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                disabled={loading || isExpired}
                            />
                            <Key
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                        </div>
                    </motion.div>

                    <motion.div className="mb-6">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Mật khẩu mới
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all disabled:bg-gray-100"
                                placeholder="Nhập mật khẩu mới"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={loading || isExpired}
                            />
                            <Key
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                        </div>
                    </motion.div>

                    <motion.button
                        type="submit"
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 transition-all disabled:bg-red-400"
                        whileHover={{ scale: loading || isExpired ? 1 : 1.05 }}
                        whileTap={{ scale: loading || isExpired ? 1 : 0.95 }}
                        disabled={loading || isExpired}
                    >
                        {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                    </motion.button>
                </form>

                {isExpired && (
                    <motion.div className="mt-4 text-center">
                        <button
                            onClick={handleResendCode}
                            className="text-red-600 hover:underline font-medium disabled:text-gray-400"
                            disabled={loading}
                        >
                            {loading ? "Đang gửi..." : "Gửi lại mã OTP"}
                        </button>
                    </motion.div>
                )}

                <motion.div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Nhớ mật khẩu?{" "}
                        <Link to="/login" className="text-red-600 hover:underline">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </motion.div>
            </motion.div>

            <ToastContainer />
        </motion.div>
    );
};

export default ResetPasswordPage;