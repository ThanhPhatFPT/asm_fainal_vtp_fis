import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Thêm useNavigate
import { Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // Thêm navigate để chuyển hướng

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

            // Chuyển hướng sang trang ResetPasswordPage với email
            setTimeout(() => {
                navigate(`/reset-password?email=${encodeURIComponent(email)}`);
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

    return (
        <motion.div className="min-h-screen flex items-center justify-center bg-gray-50">
            <motion.div className="max-w-md w-full bg-white shadow-md rounded-lg overflow-hidden">
                <div className="bg-red-600 py-4 px-6">
                    <h2 className="text-xl font-bold text-white">Quên mật khẩu</h2>
                    <p className="text-red-100 text-sm">
                        Nhập email để nhận hướng dẫn đặt lại mật khẩu
                    </p>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        <motion.div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                                Email hoặc số điện thoại
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-all"
                                    placeholder="Nhập email hoặc số điện thoại"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <Smartphone
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    size={18}
                                />
                            </div>
                        </motion.div>

                        <motion.button
                            type="submit"
                            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 transition-all disabled:bg-red-400"
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            disabled={loading}
                        >
                            {loading ? "Đang gửi yêu cầu..." : "Gửi yêu cầu"}
                        </motion.button>
                    </form>

                    <motion.div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Nhớ mật khẩu?{" "}
                            <Link to="/login" className="text-red-600 hover:underline">
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            <ToastContainer />
        </motion.div>
    );
};

export default ForgotPasswordPage;