import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Range } from "react-range";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaMinus, FaPlus } from "react-icons/fa";
import ProductService from "../service/ProductService.js";
import CategoryService from "../service/CategoryService.js";
import CartItemService from "../service/CartItemService.js";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AllProducts = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [sortField, setSortField] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [priceRange, setPriceRange] = useState([0, 50000000]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [showAllCategories, setShowAllCategories] = useState(false);
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

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const productResponse = await ProductService.getAllProducts("ACTIVE");
                setProducts(productResponse.data || []);

                const categoryResponse = await CategoryService.getAllCategories();
                const activeCategories = categoryResponse.filter((cat) => cat.status === "active");
                setCategories(activeCategories);
            } catch (error) {
                console.error("Không thể tải dữ liệu:", error);
                setProducts([]);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Handle search
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // Handle sort
    const handleSort = (field) => {
        setSortField(field);
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        setCurrentPage(1);
    };

    // Handle category checkbox selection
    const handleCategoryCheckbox = (categoryId) => {
        const isSelected = selectedCategoryIds.includes(categoryId);
        if (isSelected) {
            setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== categoryId));
        } else {
            setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
        }
        setCurrentPage(1);
    };

    // Toggle show all categories
    const toggleShowAllCategories = () => {
        setShowAllCategories(!showAllCategories);
    };

    // Filter and sort products
    const getFilteredAndSortedProducts = () => {
        let filtered = [...products];

        if (searchTerm) {
            filtered = filtered.filter(
                (product) =>
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        filtered = filtered.filter((product) => {
            const discountedPrice = calculateDiscountedPrice(product.price, product.discount);
            const sliderFilter = discountedPrice >= priceRange[0] && discountedPrice <= priceRange[1];
            const categoryFilter =
                selectedCategoryIds.length === 0 || selectedCategoryIds.includes(product.category?.id);
            return sliderFilter && categoryFilter;
        });

        filtered.sort((a, b) => {
            let aValue = sortField === "category" ? a.category?.name || "" : a[sortField];
            let bValue = sortField === "category" ? b.category?.name || "" : b[sortField];
            if (typeof aValue === "string") {
                return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
            return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        });

        return filtered;
    };

    // Pagination
    const paginatedProducts = () => {
        const filteredAndSorted = getFilteredAndSortedProducts();
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredAndSorted.slice(indexOfFirstItem, indexOfLastItem);
    };

    const totalPages = Math.ceil(getFilteredAndSortedProducts().length / itemsPerPage);

    // Reset filters
    const resetFilters = () => {
        setSearchTerm("");
        setPriceRange([0, 50000000]);
        setSelectedCategoryIds([]);
        setSortField("name");
        setSortOrder("asc");
        setCurrentPage(1);
        setShowAllCategories(false);
    };

    // Danh mục hiển thị (5 mặc định hoặc tất cả nếu "Xem thêm" được bấm)
    const displayedCategories = showAllCategories ? categories : categories.slice(0, 5);

    // Animation variants for product cards and modal
    const productVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
    };

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
        setSelectedImage(0);
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
        <div className="container mx-auto px-4 py-8 min-h-screen mt-6">
            <ToastContainer position="top-right" autoClose={1000} hideProgressBar={false} />
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Filter Sidebar */}
                <div className="lg:w-1/4 w-full">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4 z-30">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Bộ lọc sản phẩm</h2>

                        {/* Search */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>

                        {/* Price Range Slider */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng giá</label>
                            <Range
                                step={100000}
                                min={0}
                                max={50000000}
                                values={priceRange}
                                onChange={(values) => setPriceRange(values)}
                                renderTrack={({ props, children }) => (
                                    <div {...props} className="h-1 bg-gray-200 rounded-full">
                                        <div
                                            className="h-1 bg-red-500 rounded-full"
                                            style={{
                                                width: `${((priceRange[1] - priceRange[0]) / 50000000) * 100}%`,
                                                marginLeft: `${(priceRange[0] / 50000000) * 100}%`,
                                            }}
                                        />
                                        {children}
                                    </div>
                                )}
                                renderThumb={({ props, isDragged }) => (
                                    <div
                                        {...props}
                                        className={`h-4 w-4 bg-red-500 rounded-full focus:outline-none shadow ${isDragged ? "ring-2 ring-blue-300" : ""}`}
                                    />
                                )}
                            />
                            <div className="flex justify-between text-sm text- mt-2">
                                <span>{formatPrice(priceRange[0])}</span>
                                <span>{formatPrice(priceRange[1])}</span>
                            </div>
                        </div>

                        {/* Category Checkboxes */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {displayedCategories.map((category) => (
                                    <div key={category.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategoryIds.includes(category.id)}
                                            onChange={() => handleCategoryCheckbox(category.id)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label className="ml-2 text-sm text-gray-700 hover:text-red-800">{category.name}</label>
                                    </div>
                                ))}
                            </div>
                            {categories.length > 5 && (
                                <button
                                    onClick={toggleShowAllCategories}
                                    className="mt-2 flex items-center text-red-500 hover:text-red-800 text-sm"
                                >
                                    {showAllCategories ? "Thu gọn" : "Xem thêm"}
                                    {showAllCategories ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
                                </button>
                            )}
                        </div>

                        {/* Sort */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp theo</label>
                            <div className="flex gap-2">
                                <select
                                    value={sortField}
                                    onChange={(e) => handleSort(e.target.value)}
                                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="name">Tên</option>
                                    <option value="price">Giá</option>
                                    <option value="discount">Giảm giá</option>
                                    <option value="category">Danh mục</option>
                                </select>
                                <button
                                    onClick={() => handleSort(sortField)}
                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {sortOrder === "asc" ? "Tăng" : "Giảm"}
                                </button>
                            </div>
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={resetFilters}
                            className="w-full py-2 bg-red-200 text-gray-700 rounded-md hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                        >
                            Đặt lại bộ lọc
                        </button>
                    </div>
                </div>

                {/* Product List */}
                <div className="lg:w-3/4 w-full">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h1 className="text-2xl font-semibold text-gray-800">Tất cả sản phẩm</h1>
                    </div>

                    {loading ? (
                        <div className="text-center py-10 text-gray-600">Đang tải sản phẩm...</div>
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
                                            className="relative group h-full flex flex-col"
                                        >
                                            <Link
                                                to={`/productDetail/${product.id}`}
                                                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-300 group-hover:bg-opacity-75 group-hover:bg-gray-100 block flex flex-col h-full"
                                            >
                                                <div className="relative overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={product.imageUrls[0] || "https://via.placeholder.com/150"}
                                                        alt={product.name}
                                                        className="w-full h-48 object-contain mb-4 rounded-md transition-transform duration-300 group-hover:scale-110 group-hover:opacity-80"
                                                        onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                                                    />
                                                    {product.discount > 0 && (
                                                        <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                                            -{product.discount}%
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col flex-grow">
                                                    <h3 className="text-base font-semibold text-gray-800 mb-2 truncate">{product.name}</h3>
                                                    <div className="mt-auto flex flex-col">
                                                        <span className="text-red-600 font-bold text-lg">
                                                            {formatPrice(calculateDiscountedPrice(product.price, product.discount))}
                                                        </span>
                                                        <span className="text-gray-500 text-sm line-through min-h-[1.25rem]">
                                                            {product.discount > 0 ? formatPrice(product.price) : ""}
                                                        </span>
                                                        {/* Thêm nhãn Trả góp 0% */}
                                                        <span className="text-green-600 text-xs font-medium mt-1">
                                                            {product.price >= 3000000 ? "Trả góp 0%" : ""}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm mt-1 truncate">
                                                        {product.category?.name || "Không có danh mục"}
                                                    </p>
                                                </div>
                                            </Link>
                                            <button
                                                onClick={() => openModal(product)}
                                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-red-500 text-white py-1 px-2 rounded-full flex items-center justify-center space-x-1 hover:bg-red-600 transition-all duration-300 shadow-lg text-xs font-medium whitespace-nowrap"
                                                disabled={product.quantity === 0}
                                            >
                                                <FaShoppingCart size={12} />
                                                <span>{product.quantity > 0 ? "Thêm vào giỏ" : "Hết hàng"}</span>
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-10 text-gray-600">
                                        Không tìm thấy sản phẩm nào
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-lg shadow-md">
                            <div className="text-sm text-gray-600">
                                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                                {Math.min(currentPage * itemsPerPage, getFilteredAndSortedProducts().length)} của{" "}
                                {getFilteredAndSortedProducts().length} sản phẩm
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-gray-600"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm font-medium text-gray-700">
                                    Trang {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-gray-600"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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

export default AllProducts;