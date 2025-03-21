import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // Thêm framer-motion
import ProductService from "../service/ProductService.js";

const ProductsByCategory = () => {
    const { categoryId } = useParams();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categoryName, setCategoryName] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");

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
        setCurrentPage(1); // Reset về trang đầu tiên khi tìm kiếm
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

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
            <div className="w-full">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900">
                        Sản phẩm thuộc danh mục: {categoryName || "Đang tải..."}
                    </h1>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm theo tên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-md p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                {/* Product List */}
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Đang tải sản phẩm...</div>
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
                                    >
                                        <Link
                                            to={`/productDetail/${product.id}`}
                                            className="bg-white rounded-lg shadow-sm p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 block"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={product.imageUrls[0] || "https://via.placeholder.com/150"}
                                                    alt={product.name}
                                                    className="w-full h-48 object-contain mb-4 rounded-md"
                                                    onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                                                />
                                                {product.discount > 0 && (
                                                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                                        -{product.discount}%
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-base font-medium text-gray-800 mb-2 truncate">{product.name}</h3>
                                            <div className="flex flex-col">
                                                <span className="text-red-600 font-semibold text-lg">
                                                    {formatPrice(calculateDiscountedPrice(product.price, product.discount))}
                                                </span>
                                                {product.discount > 0 && (
                                                    <span className="text-gray-400 text-sm line-through">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
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
                    <div className="mt-8 flex items-center justify-between bg-white p-4 rounded-lg shadow-md">
                        <div className="text-sm text-gray-600">
                            Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                            {Math.min(currentPage * itemsPerPage, filteredProducts.length)} của {filteredProducts.length} sản phẩm
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeftIcon />
                            </button>
                            <span className="text-sm font-medium text-gray-700">
                                Trang {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 transition-colors"
                            >
                                <ChevronRightIcon />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsByCategory;