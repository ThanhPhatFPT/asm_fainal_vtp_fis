import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaMinus, FaPlus } from "react-icons/fa";
import ProductService from "../service/ProductService.js";
import CartItemService from "../service/CartItemService.js";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProductsByCategory = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categoryName, setCategoryName] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);

    // Format VND price
    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    };

    // Calculate discounted price
    const calculateDiscountedPrice = (price, discount) => {
        return price * (1 - discount / 100);
    };

    // Fetch products by category ID
    useEffect(() => {
        const fetchData = async () => {
            if (!categoryId) return;

            setLoading(true);
            try {
                const productResponse = await ProductService.getProductsByCategory(categoryId);
                const productList = productResponse.data || [];
                setProducts(productList);
                setFilteredProducts(productList);

                if (productList.length > 0) {
                    const category = productList[0].category;
                    setCategoryName(category?.name || "Không tìm thấy");
                } else {
                    setCategoryName("Không tìm thấy");
                }
            } catch (error) {
                console.error("Không thể tải dữ liệu:", error);
                setProducts([]);
                setFilteredProducts([]);
                setCategoryName(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [categoryId]);

    // Filter products by search term
    useEffect(() => {
        const filtered = products.filter((product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(filtered);
        setCurrentPage(1);
    }, [searchTerm, products]);

    // Pagination
    const paginatedProducts = () => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    };

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Custom SVG icons
    const ChevronLeftIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );

    const ChevronRightIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
        </svg>
    );

    // Animation variants for product cards
    const productVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
    };

    // Modal animation
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
    };

    // Handle user info from token
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

    // Handle opening modal
    const openModal = (product) => {
        setSelectedProduct(product);
        setQuantity(1);
        setSelectedImage(0); // Reset selected image
        setIsModalOpen(true);
    };

    // Handle closing modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    // Handle quantity changes
    const increaseQuantity = () => {
        if (selectedProduct && quantity < selectedProduct.quantity) {
            setQuantity(quantity + 1);
        }
    };

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    // Handle adding to cart
    const handleAddToCart = async () => {
        if (!selectedProduct || selectedProduct.quantity === 0) {
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
            const existingItem = cartItems.find((item) => item.product.id === selectedProduct.id);

            const currentCartQuantity = existingItem ? existingItem.quantity : 0;
            const totalQuantity = currentCartQuantity + quantity;

            if (totalQuantity > selectedProduct.quantity) {
                toast.error(
                    `Không thể thêm ${quantity} sản phẩm. Số lượng trong giỏ (${currentCartQuantity}) cộng thêm số lượng này (${quantity}) vượt quá tồn kho (${selectedProduct.quantity}).`,
                    { autoClose: 1000 }
                );
                return;
            }

            await CartItemService.addToCart(userId, selectedProduct.id, quantity);
            toast.success(`Đã thêm ${quantity} ${selectedProduct.name} vào giỏ hàng thành công!`, { autoClose: 1000 });
            closeModal();
        } catch (err) {
            toast.error(err.message || "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.", {
                autoClose: 1000,
            });
            console.error("Lỗi khi thêm vào giỏ hàng:", err);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen ">
            <ToastContainer position="top-right" autoClose={1000} hideProgressBar={false} />
            <div className="w-full">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Sản phẩm thuộc danh mục: {categoryName || "Đang tải..."}
                    </h1>
                </div>

                {/* Search Bar */}
                <div className="mb-8 flex justify-start items-center">
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm theo tên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-lg p-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-300"
                    />
                </div>

                {/* Product List */}
                {loading ? (
                    <div className="text-center py-10 text-gray-500 animate-pulse">Đang tải sản phẩm...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        <AnimatePresence>
                            {paginatedProducts().length > 0 ? (
                                paginatedProducts().map((product) => (
                                    <motion.div
                                        key={product.id}
                                        variants={productVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="h-full relative group"
                                    >
                                        <Link
                                            to={`/productDetail/${product.id}`}
                                            className="bg-white rounded-xl shadow-md p-4 transition-all duration-300 flex flex-col h-full group-hover:shadow-xl group-hover:bg-opacity-75 group-hover:bg-gray-100"
                                        >
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={product.imageUrls[0] || "https://via.placeholder.com/150"}
                                                    alt={product.name}
                                                    className="w-full h-48 object-contain mb-4 rounded-md transition-opacity duration-300 group-hover:opacity-80"
                                                    onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                                                />
                                                {product.discount > 0 && (
                                                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                                                        -{product.discount}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col flex-grow">
                                                <h3 className="text-base font-semibold text-gray-800 mb-2 truncate">{product.name}</h3>
                                                <div className="mt-auto h-16 flex flex-col justify-end">
                                                    <span className="text-red-600 font-bold text-lg">
                                                        {formatPrice(calculateDiscountedPrice(product.price, product.discount))}
                                                    </span>
                                                    <span className="text-gray-400 text-sm line-through min-h-[1.25rem]">
                                                        {product.discount > 0 ? formatPrice(product.price) : ""}
                                                    </span>
                                                    {/* Thêm nhãn Trả góp 0% */}
                                                    <span className="text-green-600 text-xs font-medium mt-1">
                                                        {product.price >= 3000000 ? "Trả góp 0%" : ""}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                        <button
                                            onClick={() => openModal(product)}
                                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-red-500 text-white py-1.5 px-3 rounded-full flex items-center justify-center space-x-1 hover:bg-red-600 transition-all duration-300 shadow-lg text-sm font-medium"
                                            disabled={product.quantity === 0}
                                        >
                                            <FaShoppingCart size={14} />
                                            <span>{product.quantity > 0 ? "Thêm vào giỏ" : "Hết hàng"}</span>
                                        </button>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10 text-gray-500">
                                    Không tìm thấy sản phẩm nào trong danh mục này
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between bg-white p-4 rounded-xl shadow-lg">
                        <div className="text-sm text-gray-600">
                            Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                            {Math.min(currentPage * itemsPerPage, filteredProducts.length)} của {filteredProducts.length} sản phẩm
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 text-gray-600 hover:text-red-500 disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeftIcon />
                            </button>
                            <span className="text-sm font-medium text-gray-700">
                                Trang {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 text-gray-600 hover:text-red-500 disabled:opacity-50 transition-colors"
                            >
                                <ChevronRightIcon />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && selectedProduct && (
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
                        onClick={closeModal}
                    >
                        <div
                            className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Product Image */}
                                <div className="flex-1 text-center">
                                    <img
                                        src={selectedProduct.imageUrls[selectedImage] || "https://via.placeholder.com/150"}
                                        alt={selectedProduct.name}
                                        className="w-full max-w-md mx-auto rounded-xl shadow-lg object-contain h-80 transition-transform duration-300 hover:scale-105"
                                        onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                                    />
                                    <div className="flex justify-center space-x-3 mt-4">
                                        {selectedProduct.imageUrls.map((img, index) => (
                                            <img
                                                key={index}
                                                src={img}
                                                alt={`Thumbnail ${index}`}
                                                className={`w-16 h-16 border rounded-lg cursor-pointer transition-all duration-200 ${
                                                    selectedImage === index ? "border-red-500 shadow-md" : "border-gray-300 hover:border-gray-500"
                                                }`}
                                                onClick={() => setSelectedImage(index)}
                                                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Product Details */}
                                <div className="flex-1">
                                    <h2 className="text-3xl font-bold text-gray-800 mb-4">{selectedProduct.name}</h2>
                                    <div className="mt-4">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Mô tả sản phẩm</h3>
                                        <p className="text-gray-600 text-base leading-relaxed">{selectedProduct.description}</p>
                                    </div>
                                    <div className="mt-4">
                                        <span className="font-semibold text-gray-700">Số lượng còn lại: </span>
                                        <span className="text-gray-600">{selectedProduct.quantity}</span>
                                    </div>
                                    <div className="mt-4">
                                        <span className="font-semibold text-gray-700">Danh mục: </span>
                                        <span className="text-gray-600">{selectedProduct.category.name}</span>
                                    </div>
                                    <div className="bg-gradient-to-r from-red-100 to-yellow-100 p-4 rounded-xl mt-6 shadow-md">
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl font-bold text-red-600">
                                                {formatPrice(calculateDiscountedPrice(selectedProduct.price, selectedProduct.discount))}
                                            </span>
                                            {selectedProduct.discount > 0 && (
                                                <span className="text-gray-500 line-through text-lg">
                                                    {formatPrice(selectedProduct.price)}
                                                </span>
                                            )}
                                        </div>
                                        {selectedProduct.discount > 0 && (
                                            <span className="text-sm text-green-600 font-medium">Giảm {selectedProduct.discount}%</span>
                                        )}
                                    </div>
                                    <div className="mt-6">
                                        <span className="text-gray-700 font-semibold mr-4">Số lượng:</span>
                                        <div className="inline-flex items-center bg-gray-100 rounded-full p-1 shadow-md">
                                            <button
                                                onClick={decreaseQuantity}
                                                className="w-10 h-10 flex items-center justify-center bg-white text-gray-700 rounded-full hover:bg-gray-200 transition duration-200 disabled:bg-gray-100 disabled:text-gray-400"
                                                disabled={quantity <= 1 || selectedProduct.quantity === 0}
                                            >
                                                <FaMinus size={14} />
                                            </button>
                                            <span className="w-16 text-center text-lg font-semibold text-gray-800">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={increaseQuantity}
                                                className="w-10 h-10 flex items-center justify-center bg-white text-red-500 rounded-full hover:bg-red-100 transition duration-200 disabled:bg-gray-100 disabled:text-gray-400"
                                                disabled={quantity >= selectedProduct.quantity || selectedProduct.quantity === 0}
                                            >
                                                <FaPlus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <button
                                            onClick={handleAddToCart}
                                            className={`w-full bg-red-500 text-white py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-600 transition duration-300 shadow-md font-semibold ${
                                                selectedProduct.quantity === 0 ? "bg-gray-400 cursor-not-allowed" : ""
                                            }`}
                                            disabled={selectedProduct.quantity === 0}
                                        >
                                            <FaShoppingCart size={16} />
                                            <span>{selectedProduct.quantity > 0 ? "Thêm vào giỏ hàng" : "Hết hàng"}</span>
                                        </button>
                                        <button
                                            onClick={closeModal}
                                            className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition duration-300 font-medium"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductsByCategory;