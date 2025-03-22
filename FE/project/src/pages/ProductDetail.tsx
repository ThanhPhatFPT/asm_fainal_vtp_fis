import { useState, useEffect } from "react";
import { FaShoppingCart, FaMinus, FaPlus } from "react-icons/fa";
import { Link, useParams, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import { useInView } from "react-intersection-observer"; // Thêm react-intersection-observer
import ProductService from "../service/ProductService.js";
import CartItemService from "../service/CartItemService.js";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [relatedLoading, setRelatedLoading] = useState(false);

    // Theo dõi khi phần "Sản phẩm liên quan" vào viewport
    const { ref, inView } = useInView({
        triggerOnce: true, // Chỉ chạy một lần khi vào viewport
        threshold: 0.1, // 10% của phần tử phải xuất hiện trong viewport
    });

    // Tải sản phẩm hiện tại
    const fetchProduct = async () => {
        try {
            const productResponse = await ProductService.getProductById(id);
            const currentProduct = productResponse.data;

            if (currentProduct.status !== "ACTIVE") {
                throw new Error("Sản phẩm không tồn tại hoặc không hoạt động.");
            }
            setProduct(currentProduct);
            setError(null);
        } catch (err) {
            setError(
                err.message || "Không thể tải thông tin sản phẩm. Vui lòng thử lại sau."
            );
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Tải sản phẩm liên quan khi vào viewport
    const fetchRelatedProducts = async () => {
        if (!product) return; // Đợi sản phẩm chính tải xong
        setRelatedLoading(true);
        try {
            const allProductsResponse = await ProductService.getAllProducts("ACTIVE");
            const allProducts = allProductsResponse.data.filter((p) => p.status === "ACTIVE");

            const filteredRelatedProducts = allProducts
                .filter(
                    (p) =>
                        p.category.id === product.category.id &&
                        p.id !== product.id &&
                        p.status === "ACTIVE"
                )
                .slice(0, 8) // Giới hạn 15 sản phẩm
                .map((p) => ({
                    id: p.id,
                    name: p.name,
                    price: p.price.toLocaleString("vi-VN") + " ₫",
                    originalPrice:
                        p.discount > 0
                            ? (p.price / (1 - p.discount / 100)).toLocaleString("vi-VN") + " ₫"
                            : p.price.toLocaleString("vi-VN") + " ₫",
                    image: p.imageUrls[0] || "https://via.placeholder.com/150",
                    discount: p.discount > 0 ? `${p.discount}%` : null,
                }));

            setRelatedProducts(filteredRelatedProducts);
        } catch (err) {
            console.error("Không thể tải sản phẩm liên quan:", err);
        } finally {
            setRelatedLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [id]);

    useEffect(() => {
        if (inView && relatedProducts.length === 0) {
            fetchRelatedProducts();
        }
    }, [inView, product]);

    const getUserInfoFromToken = () => {
        const token = Cookies.get("token");
        if (!token) return null;
        try {
            const decodedToken = jwtDecode(token);
            const userId = decodedToken.userId;
            const roles = decodedToken.roles || decodedToken.role || [];
            if (!userId) throw new Error("Không tìm thấy userId trong token.");
            return { userId, roles: Array.isArray(roles) ? roles : [roles] };
        } catch (err) {
            throw new Error("Token không hợp lệ: " + err.message);
        }
    };

    const increaseQuantity = () => {
        if (product && quantity < product.quantity) {
            setQuantity(quantity + 1);
        }
    };

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const handleAddToCart = async () => {
        if (!product || product.quantity === 0) {
            toast.error("Sản phẩm đã hết hàng!", { autoClose: 1000 });
            return;
        }

        let userId;
        try {
            const userInfo = getUserInfoFromToken();
            if (!userInfo) {
                toast.warn("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!", {
                    autoClose: 1000,
                    onClose: () => navigate("/login"),
                });
                return;
            }
            userId = userInfo.userId;
            const roles = userInfo.roles;

            if (!roles.includes("USER") && !roles.includes("ROLE_USER")) {
                toast.error("Chỉ người dùng có vai trò USER mới có thể thêm sản phẩm vào giỏ hàng!", {
                    autoClose: 1000,
                });
                return;
            }
        } catch (err) {
            toast.error(err.message, { autoClose: 1000 });
            return;
        }

        try {
            const cartItems = await CartItemService.getCartItemsByUser(userId);
            const existingItem = cartItems.find((item) => item.product.id === product.id);

            const currentCartQuantity = existingItem ? existingItem.quantity : 0;
            const totalQuantity = currentCartQuantity + quantity;

            if (totalQuantity > product.quantity) {
                toast.error(
                    `Không thể thêm ${quantity} sản phẩm. Số lượng trong giỏ (${currentCartQuantity}) cộng thêm số lượng này (${quantity}) vượt quá tồn kho (${product.quantity}).`,
                    { autoClose: 1000 }
                );
                return;
            }

            await CartItemService.addToCart(userId, product.id, quantity);
            toast.success(`Đã thêm ${quantity} ${product.name} vào giỏ hàng thành công!`, { autoClose: 1000 });
            setQuantity(1);
        } catch (err) {
            toast.error(err.message || "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.", {
                autoClose: 1000,
            });
            console.error("Lỗi khi thêm vào giỏ hàng:", err);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 text-center text-gray-600 animate-pulse">
                Đang tải sản phẩm...
            </div>
        );
    }

    if (error) {
        return <div className="container mx-auto p-6 text-center text-red-500">{error}</div>;
    }

    if (!product) {
        return (
            <div className="container mx-auto p-6 text-center text-gray-600">Không tìm thấy sản phẩm.</div>
        );
    }

    const originalPrice = product.discount > 0 ? product.price / (1 - product.discount / 100) : product.price;

    // Cấu hình cho Slick Slider
    const sliderSettings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: Math.min(5, relatedProducts.length),
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        arrows: true,
        responsive: [
            { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 1 } },
            { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 1 } },
            { breakpoint: 640, settings: { slidesToShow: 1, slidesToScroll: 1 } },
        ],
    };

    return (
        <div className="container mx-auto p-6 min-h-screen bg-gradient-to-b  to-gray-100 mt-6 mb-6">
            <ToastContainer
                position="top-right"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <div className="text-sm text-blue-600 mb-6">
                <Link className="hover:underline" to="/">
                    Trang chủ
                </Link>{" "}
                /{" "}
                <Link className="hover:underline" to={`/category/${product.category.id}`}>
                    {product.category.name}
                </Link>{" "}
                / <span className="text-gray-700">{product.name}</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 text-center">
                    <img
                        src={product.imageUrls[selectedImage] || "https://via.placeholder.com/150"}
                        alt={product.name}
                        className="w-full max-w-lg mx-auto rounded-xl shadow-lg object-contain h-96 transition-transform duration-300 hover:scale-105"
                        onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                    />
                    <div className="flex justify-center space-x-3 mt-6">
                        {product.imageUrls.map((img, index) => (
                            <img
                                key={index}
                                src={img}
                                alt={`Thumbnail ${index}`}
                                className={`w-20 h-20 border rounded-lg cursor-pointer transition-all duration-200 ${
                                    selectedImage === index ? "border-red-500 shadow-md" : "border-gray-300 hover:border-gray-500"
                                }`}
                                onClick={() => setSelectedImage(index)}
                                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex-1 lg:pl-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>
                    <div className="mt-4">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">Mô tả sản phẩm</h2>
                        <p className="text-gray-600 text-base leading-relaxed">{product.description}</p>
                    </div>

                    <div className="mt-4">
                        <span className="font-semibold text-gray-700">Số lượng còn lại: </span>
                        <span className="text-gray-600">{product.quantity}</span>
                    </div>

                    <div className="mt-4">
                        <span className="font-semibold text-gray-700">Danh mục: </span>
                        <span className="text-gray-600">{product.category.name}</span>
                    </div>

                    <div className="bg-gradient-to-r from-red-100 to-yellow-100 p-6 rounded-xl mt-6 shadow-md">
                        <div className="flex justify-between items-center">
                            <span className="text-3xl font-bold text-red-600">
                                {product.price.toLocaleString("vi-VN")} đ
                            </span>
                            {product.discount > 0 && (
                                <span className="text-gray-500 line-through text-xl">
                                    {originalPrice.toLocaleString("vi-VN")} đ
                                </span>
                            )}
                        </div>
                        {product.discount > 0 && (
                            <span className="text-sm text-green-600 font-medium">Giảm {product.discount}%</span>
                        )}
                    </div>

                    <div className="mt-6">
                        <span className="text-gray-700 font-semibold mr-4">Số lượng:</span>
                        <div className="inline-flex items-center bg-gray-100 rounded-full p-1 shadow-sm">
                            <button
                                onClick={decreaseQuantity}
                                className="w-10 h-10 flex items-center justify-center bg-white text-gray-700 rounded-full hover:bg-gray-200 transition duration-200 disabled:bg-gray-100 disabled:text-gray-400"
                                disabled={quantity <= 1 || product.quantity === 0}
                            >
                                <FaMinus />
                            </button>
                            <span className="w-16 text-center text-lg font-semibold text-gray-800">
                                {quantity}
                            </span>
                            <button
                                onClick={increaseQuantity}
                                className="w-10 h-10 flex items-center justify-center bg-white text-red-500 rounded-full hover:bg-red-100 transition duration-200 disabled:bg-gray-100 disabled:text-gray-400"
                                disabled={quantity >= product.quantity || product.quantity === 0}
                            >
                                <FaPlus />
                            </button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            className={`w-full bg-red-500 text-white py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-600 transition duration-300 shadow-md text-lg font-semibold ${
                                product.quantity === 0 ? "bg-gray-400 cursor-not-allowed" : ""
                            }`}
                            onClick={handleAddToCart}
                            disabled={product.quantity === 0}
                        >
                            <FaShoppingCart />
                            <span>{product.quantity > 0 ? "Thêm vào giỏ hàng" : "Hết hàng"}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div ref={ref} className="mt-12">
                <h2 className="text-3xl font-bold mb-6 text-red-600">Sản phẩm liên quan</h2>
                {relatedLoading ? (
                    <p className="text-gray-600 text-center animate-pulse">Đang tải sản phẩm liên quan...</p>
                ) : relatedProducts.length > 0 ? (
                    <Slider {...sliderSettings}>
                        {relatedProducts.map((relatedProduct) => (
                            <div key={relatedProduct.id} className="px-2">
                                <Link to={`/productDetail/${relatedProduct.id}`} className="block">
                                    <div className="border rounded-xl p-4 bg-white shadow-md hover:shadow-xl transition transform hover:-translate-y-2 duration-300 flex flex-col h-full min-h-[300px]">
                                        <img
                                            src={relatedProduct.image}
                                            alt={relatedProduct.name}
                                            className="w-full h-40 object-contain mb-3 rounded-md"
                                            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                                        />
                                        <h3 className="font-semibold text-base mb-2 truncate">{relatedProduct.name}</h3>
                                        <div className="flex flex-col mt-auto">
                                            <span className="text-red-600 font-bold text-lg">{relatedProduct.price}</span>
                                            {relatedProduct.discount ? (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500 line-through text-sm">
                                                        {relatedProduct.originalPrice}
                                                    </span>
                                                    <span className="text-green-600 text-xs">
                                                        Giảm {relatedProduct.discount}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="h-6"></div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </Slider>
                ) : (
                    <p className="text-gray-600 text-center">Không có sản phẩm liên quan trong danh mục này.</p>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;