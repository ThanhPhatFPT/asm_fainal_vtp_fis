import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ProductService from "../service/ProductService.js";

const SearchBar = () => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Format giá tiền VND
    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    };

    // Tính giá sau khi giảm
    const calculateDiscountedPrice = (price, discount) => {
        return price * (1 - discount / 100);
    };

    // Lấy dữ liệu sản phẩm khi component mount
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await ProductService.getAllProducts("ACTIVE");
                setProducts(response.data || []);
            } catch (error) {
                console.error("Không thể tải sản phẩm:", error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        setQuery(e.target.value);

        if (value.length > 1) {
            const filtered = products.filter((product) =>
                product.name.toLowerCase().includes(value)
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    // Hàm để reset thanh tìm kiếm
    const handleSuggestionClick = () => {
        setQuery(""); // Reset thanh tìm kiếm về rỗng
        setSuggestions([]); // Ẩn gợi ý
    };

    // Animation variants cho gợi ý sản phẩm
    const suggestionVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.05, duration: 0.2 }, // Hiệu ứng stagger
        }),
        exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
    };

    return (
        <div className="relative w-[700px]">
            <input
                type="text"
                placeholder="Bạn tìm gì hôm nay..."
                className="bg-white text-gray-800 rounded-full py-2 px-4 w-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={query}
                onChange={handleSearch}
                disabled={loading}
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                <Search size={18} />
            </button>

            {/* Hiển thị gợi ý sản phẩm với hiệu ứng */}
            <AnimatePresence>
                {suggestions.length > 0 && (
                    <motion.ul
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 w-full bg-white border border-gray-200 shadow-md mt-1 rounded-lg max-h-96 overflow-y-auto z-10"
                    >
                        {suggestions.map((product, index) => (
                            <motion.li
                                key={product.id}
                                custom={index}
                                variants={suggestionVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <Link
                                    to={`/productDetail/${product.id}`}
                                    className="px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 block"
                                    onClick={handleSuggestionClick}
                                >
                                    <img
                                        src={product.imageUrls[0] || "https://via.placeholder.com/150"}
                                        alt={product.name}
                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-black font-medium break-words">{product.name}</p>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-red-500 font-semibold">
                                                {formatPrice(calculateDiscountedPrice(product.price, product.discount))}
                                            </p>
                                            {product.discount > 0 && (
                                                <p className="text-gray-500 text-xs line-through">
                                                    {formatPrice(product.price)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchBar;