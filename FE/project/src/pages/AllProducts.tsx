import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Range } from "react-range";
import { motion, AnimatePresence } from "framer-motion"; // Thêm framer-motion
import ProductService from "../service/ProductService.js";
import CategoryService from "../service/CategoryService.js";

const AllProducts = () => {
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

    // Animation variants for product cards
    const productVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Filter Sidebar */}
                <div className="lg:w-1/4 w-full">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
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
                                            className="h-1 bg-blue-500 rounded-full"
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
                                        className={`h-4 w-4 bg-blue-500 rounded-full focus:outline-none shadow ${isDragged ? "ring-2 ring-blue-300" : ""}`}
                                    />
                                )}
                            />
                            <div className="flex justify-between text-sm text-gray-600 mt-2">
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
                                        <label className="ml-2 text-sm text-gray-700 hover:text-blue-600">{category.name}</label>
                                    </div>
                                ))}
                            </div>
                            {categories.length > 5 && (
                                <button
                                    onClick={toggleShowAllCategories}
                                    className="mt-2 flex items-center text-blue-600 hover:text-blue-800 text-sm"
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
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {sortOrder === "asc" ? "Tăng" : "Giảm"}
                                </button>
                            </div>
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={resetFilters}
                            className="w-full py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
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
                                        >
                                            <Link
                                                to={`/productDetail/${product.id}`}
                                                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-300 group block"
                                            >
                                                <div className="relative overflow-hidden">
                                                    <img
                                                        src={product.imageUrls[0] || "https://via.placeholder.com/150"}
                                                        alt={product.name}
                                                        className="w-full h-48 object-contain mb-4 rounded-md transition-transform duration-300 group-hover:scale-110"
                                                        onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                                                    />
                                                    {product.discount > 0 && (
                                                        <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                                            -{product.discount}%
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-base font-semibold text-gray-800 mb-2 truncate">{product.name}</h3>
                                                <div className="flex flex-col">
                                                    <span className="text-red-600 font-bold text-lg">
                                                        {formatPrice(calculateDiscountedPrice(product.price, product.discount))}
                                                    </span>
                                                    {product.discount > 0 && (
                                                        <span className="text-gray-500 text-sm line-through">
                                                            {formatPrice(product.price)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 text-sm mt-1 truncate">
                                                    {product.category?.name || "Không có danh mục"}
                                                </p>
                                            </Link>
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
        </div>
    );
};

export default AllProducts;