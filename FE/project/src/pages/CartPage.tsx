import { useState, useEffect } from "react";
import { FaTrash, FaMinus, FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import CartItemService from "../service/CartItemService.js"; // Đường dẫn đến file CartItemService
import Cookies from "js-cookie";
import {jwtDecode} from "jwt-decode";

const CartPage = () => {

    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);

    // Giả sử userId được lấy từ localStorage hoặc props
    useEffect(() => {
        // Lấy userId từ token JWT trong cookie
        const getUserIdFromToken = () => {
            const token = Cookies.get("token"); // Đọc token từ cookie
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    return decoded.userId; // userId phải có trong payload của token
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

    // Lấy danh sách giỏ hàng khi component mount
    useEffect(() => {
        if (!userId) return;

        const fetchCartItems = async () => {
            try {
                setLoading(true);
                const data = await CartItemService.getCartItemsByUser(userId);
                setCartItems(data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCartItems();
    }, [userId]);

    // Tăng số lượng sản phẩm
    const increaseQuantity = async (cartItemId) => {
        const item = cartItems.find((item) => item.id === cartItemId);
        if (!item) return;

        // Kiểm tra nếu số lượng trong giỏ đã đạt tối đa của sản phẩm
        if (item.quantity >= item.product.quantity) {
            setError(`Số lượng trong giỏ không thể vượt quá ${item.product.quantity} sản phẩm có sẵn.`);
            return;
        }

        try {
            const updatedItem = await CartItemService.updateQuantity(cartItemId, item.quantity + 1);
            setCartItems(cartItems.map((i) =>
                i.id === cartItemId ? updatedItem : i
            ));
            setError(null); // Xóa thông báo lỗi nếu thành công
        } catch (err) {
            setError(err.message);
        }
    };

    // Giảm số lượng sản phẩm
    const decreaseQuantity = async (cartItemId) => {
        const item = cartItems.find((item) => item.id === cartItemId);
        if (!item || item.quantity <= 1) return;

        try {
            const updatedItem = await CartItemService.updateQuantity(cartItemId, item.quantity - 1);
            setCartItems(cartItems.map((i) =>
                i.id === cartItemId ? updatedItem : i
            ));
            setError(null); // Xóa thông báo lỗi nếu thành công
        } catch (err) {
            setError(err.message);
        }
    };

    // Xóa sản phẩm khỏi giỏ hàng
    const removeItem = async (cartItemId) => {
        try {
            await CartItemService.removeFromCart(cartItemId);
            setCartItems(cartItems.filter((item) => item.id !== cartItemId));
            setError(null); // Xóa thông báo lỗi nếu thành công
        } catch (err) {
            setError(err.message);
        }
    };

    // Hàm tính giá gốc dựa trên giá hiện tại và phần trăm giảm giá
    const calculateOriginalPrice = (price, discount) => {
        if (discount === 0) return price; // Nếu không có giảm giá, giá gốc bằng giá hiện tại
        return Math.round(price / (1 - discount / 100));
    };

    // Tính tổng tiền (dựa trên giá đã giảm)
    const totalPrice = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

    if (loading) {
        return <div className="container mx-auto p-6 text-center">Đang tải giỏ hàng...</div>;
    }

    return (
        <div className="container mx-auto p-6 mt-6">
            <h1 className="text-3xl font-bold mb-6 text-center text-red-600">Giỏ hàng của bạn</h1>

            {error && (
                <div className="text-center text-red-500 mb-4">{error}</div>
            )}

            {cartItems.length === 0 ? (
                <p className="text-center text-gray-500 text-lg">Giỏ hàng của bạn đang trống.</p>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    {cartItems.map((item) => {
                        const originalPrice = calculateOriginalPrice(item.product.price, item.product.discount);
                        return (
                            <div key={item.id} className="flex items-center justify-between border-b py-4">
                                {/* Hình ảnh sản phẩm */}
                                <img
                                    src={item.product.imageUrls[0]} // Lấy ảnh đầu tiên từ mảng imageUrls
                                    alt={item.product.name}
                                    className="w-24 h-24 object-cover rounded-lg"
                                />

                                {/* Thông tin sản phẩm */}
                                <div className="flex-1 px-4">
                                    <h2 className="text-lg font-bold">{item.product.name}</h2>
                                    <p className="text-gray-500 text-sm">
                                        Số lượng tối đa: {item.product.quantity} | Giảm giá: {item.product.discount}%
                                    </p>
                                    <div>
                                        <p className="text-gray-500 line-through">{originalPrice.toLocaleString()} đ</p>
                                        <p className="text-red-600 font-semibold">{item.product.price.toLocaleString()} đ</p>
                                    </div>
                                </div>

                                {/* Nút tăng giảm số lượng */}
                                <div className="flex items-center space-x-3">
                                    <button
                                        className="bg-gray-200 text-gray-800 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-300 transition"
                                        onClick={() => decreaseQuantity(item.id)}
                                        disabled={item.quantity <= 1} // Vô hiệu hóa nếu số lượng là 1
                                    >
                                        <FaMinus />
                                    </button>
                                    <span className="text-lg font-semibold w-10 text-center">{item.quantity}</span>
                                    <button
                                        className="bg-red-500 text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-600 transition"
                                        onClick={() => increaseQuantity(item.id)}
                                        disabled={item.quantity >= item.product.quantity} // Vô hiệu hóa nếu đạt tối đa
                                    >
                                        <FaPlus />
                                    </button>
                                </div>

                                {/* Nút xóa sản phẩm */}
                                <button
                                    className="text-red-500 hover:text-red-700 ml-4"
                                    onClick={() => removeItem(item.id)}
                                >
                                    <FaTrash size={20} />
                                </button>
                            </div>
                        );
                    })}

                    {/* Tổng tiền */}
                    <div className="text-right mt-6">
                        <h2 className="text-xl font-bold mb-3">
                            Tổng cộng: <span className="text-red-600">{totalPrice.toLocaleString()} đ</span>
                        </h2>
                        <Link
                            to="/checkoutPage"
                            className="mt-4 bg-red-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-red-600"
                        >
                            Tiến hành thanh toán
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;