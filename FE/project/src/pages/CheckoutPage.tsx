import { useEffect, useState } from "react";
import { FaCheckCircle, FaPlus, FaMinus, FaTrash } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CartItemService from "../service/CartItemService.js";
import OrderService from "../service/OrderService";
import Cookies from "js-cookie";
import { useNavigate } from 'react-router-dom';

const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
};

const CheckoutPage = () => {
    const [selectedWarranty, setSelectedWarranty] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const getUserIdFromToken = () => {
            const token = Cookies.get("token");
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    return decoded.userId;
                } catch (error) {
                    console.error("Lỗi khi giải mã token:", error);
                }
            }
            return null;
        };

        const uid = getUserIdFromToken();
        if (uid) {
            setUserId(uid);
        } else {
            setError("Vui lòng đăng nhập để xem giỏ hàng.");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!userId) return;

        const fetchCartItems = async () => {
            try {
                setLoading(true);
                const data = await CartItemService.getCartItemsByUser(userId);
                const activeItems = (data || []).filter(
                    (item) => item.product.status === "ACTIVE"
                );
                setCartItems(activeItems);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCartItems();
    }, [userId]);

    const increaseQuantity = async (cartItemId) => {
        const item = cartItems.find((item) => item.id === cartItemId);
        if (!item || item.quantity >= item.product.quantity) return;

        try {
            const updatedItem = await CartItemService.updateQuantity(
                cartItemId,
                item.quantity + 1
            );
            setCartItems(cartItems.map((i) => (i.id === cartItemId ? updatedItem : i)));
        } catch (err) {
            setError(err.message);
        }
    };

    const decreaseQuantity = async (cartItemId) => {
        const item = cartItems.find((item) => item.id === cartItemId);
        if (!item || item.quantity <= 1) return;

        try {
            const updatedItem = await CartItemService.updateQuantity(
                cartItemId,
                item.quantity - 1
            );
            setCartItems(cartItems.map((i) => (i.id === cartItemId ? updatedItem : i)));
        } catch (err) {
            setError(err.message);
        }
    };

    const removeItem = async (cartItemId) => {
        try {
            await CartItemService.removeFromCart(cartItemId);
            setCartItems(cartItems.filter((item) => item.id !== cartItemId));
        } catch (err) {
            setError(err.message);
        }
    };

    const calculateOriginalPrice = (price, discount) => {
        if (discount === 0) return price;
        return Math.round(price / (1 - discount / 100));
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            setError("Giỏ hàng trống, vui lòng thêm sản phẩm để thanh toán");
            return;
        }

        setIsProcessing(true);
        try {
            const orderRequest = {
                cartItemIds: cartItems.map((item) => item.id),
                warranty: selectedWarranty,
            };

            const orderData = await OrderService.createOrder(orderRequest);

            await new Promise((resolve) => setTimeout(resolve, 3000));

            setCartItems([]);

            toast.success(`Đơn hàng đã được tạo thành công! Mã đơn hàng: ${orderData.id}`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });

            navigate('/orders'); // Redirect to /orders
        } catch (err) {
            toast.error("Lỗi khi tạo đơn hàng: " + (err.message || "Vui lòng thử lại"), {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const totalPrice = cartItems.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
    );
    const discount = cartItems.reduce((total, item) => {
        const originalPrice = calculateOriginalPrice(item.product.price, item.product.discount);
        return total + (originalPrice - item.product.price) * item.quantity;
    }, 0);
    const warrantyPrice = selectedWarranty ? 700000 : 0;
    const finalPrice = totalPrice + warrantyPrice;

    if (loading) return <div className="container mx-auto p-6 text-center">Đang tải...</div>;
    if (error) return <div className="container mx-auto p-6 text-center text-red-500">Error: {error}</div>;

    return (
        <motion.div>
            <div className="container mx-auto p-8 max-w-5xl bg-gray-50 rounded-xl shadow-lg mt-10">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">🛒 Giỏ hàng của bạn</h1>

                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">Sản phẩm trong giỏ ({cartItems.length})</h2>

                        {cartItems.map((item) => {
                            const originalPrice = calculateOriginalPrice(item.product.price, item.product.discount);
                            return (
                                <div key={item.id} className="flex items-center justify-between border-b py-4">
                                    <img
                                        src={item.product.imageUrls[0]}
                                        alt={item.product.name}
                                        className="w-16 h-16 object-cover rounded-xl"
                                    />
                                    <div className="flex-1 px-4">
                                        <h2 className="text-lg font-semibold text-gray-800">{item.product.name}</h2>
                                        <p className="text-gray-500 text-sm">Số lượng tối đa: {item.product.quantity}</p>
                                        <p className="text-red-600 font-semibold">
                                            {item.product.price.toLocaleString()} đ{" "}
                                            <span className="text-gray-400 line-through ml-2">
                                                {originalPrice.toLocaleString()} đ
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => decreaseQuantity(item.id)}
                                            disabled={item.quantity <= 1}
                                            className="px-3 py-2 border rounded-lg hover:bg-gray-200 transition text-gray-700 disabled:opacity-50"
                                        >
                                            <FaMinus />
                                        </button>
                                        <span className="px-4 text-gray-700 font-semibold">{item.quantity}</span>
                                        <button
                                            onClick={() => increaseQuantity(item.id)}
                                            disabled={item.quantity >= item.product.quantity}
                                            className="px-3 py-2 border rounded-lg hover:bg-gray-200 transition text-gray-700 disabled:opacity-50"
                                        >
                                            <FaPlus />
                                        </button>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-500 hover:text-red-700 transition ml-3"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="mt-4 bg-gray-100 p-4 rounded-xl flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={selectedWarranty}
                                onChange={() => setSelectedWarranty(!selectedWarranty)}
                                className="h-5 w-5 text-red-500 focus:ring-red-400 cursor-pointer"
                            />
                            <span className="text-gray-700 text-sm">Đặc quyền bảo hành thêm 1 năm (+700.000 đ)</span>
                        </div>
                    </div>

                    <div className="col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">📋 Thông tin đơn hàng</h2>
                        <div className="flex justify-between text-md font-medium text-gray-700">
                            <span>Tổng tiền:</span>
                            <span>{totalPrice.toLocaleString()} đ</span>
                        </div>
                        <div className="flex justify-between text-md font-medium mt-2 text-green-600">
                            <span>Khuyến mãi:</span>
                            <span>- {discount.toLocaleString()} đ</span>
                        </div>
                        {selectedWarranty && (
                            <div className="flex justify-between text-md font-medium mt-2 text-blue-600">
                                <span>Bảo hành:</span>
                                <span>+ {warrantyPrice.toLocaleString()} đ</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold mt-4">
                            <span>Thành tiền:</span>
                            <span className="text-red-600">{finalPrice.toLocaleString()} đ</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isProcessing || cartItems.length === 0}
                            className={`mt-6 w-full bg-red-500 text-white py-3 rounded-xl text-lg font-semibold flex items-center justify-center space-x-2 transition
                                ${isProcessing || cartItems.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600"}`}
                        >
                            <FaCheckCircle />
                            <span>{isProcessing ? "Đang xử lý..." : "Xác nhận đơn"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {isProcessing && (
                <motion.div
                    className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={modalVariants}
                >
                    <motion.div
                        className="bg-gradient-to-br from-white to-gray-100 rounded-xl p-8 shadow-2xl flex flex-col items-center w-80"
                        variants={modalVariants}
                    >
                        <svg className="animate-spin h-12 w-12 text-transparent" viewBox="0 0 36 36">
                            <circle
                                className="opacity-20"
                                cx="18"
                                cy="18"
                                r="16"
                                stroke="#e5e7eb"
                                strokeWidth="4"
                                fill="none"
                            />
                            <circle
                                cx="18"
                                cy="18"
                                r="16"
                                stroke="url(#gradient)"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray="100"
                                strokeDashoffset="25"
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: "#ef4444", stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: "#f97316", stopOpacity: 1 }} />
                                </linearGradient>
                            </defs>
                        </svg>
                        <motion.p
                            className="text-gray-800 text-xl font-semibold mt-6"
                            animate={{ opacity: [1, 0.7, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            Đang xử lý thanh toán
                        </motion.p>
                        <p className="text-gray-500 text-sm mt-2">Vui lòng đợi...</p>
                    </motion.div>
                </motion.div>
            )}

            <ToastContainer />
        </motion.div>
    );
};

export default CheckoutPage;