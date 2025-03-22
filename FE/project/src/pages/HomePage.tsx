import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { FaShoppingCart, FaMinus, FaPlus } from "react-icons/fa";
import CategoryService from '../service/CategoryService.js';
import ProductService from '../service/ProductService.js';
import CartItemService from '../service/CartItemService.js';
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const HomePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [countdown, setCountdown] = useState({});

  // Format tiền tệ VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  // Tính giá sau khi giảm
  const calculateDiscountedPrice = (price, discount) => {
    return price * (1 - discount / 100);
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchCategories = async () => {
      try {
        const data = await CategoryService.getAllCategories();
        const activeCategories = data.filter(category => category.status === 'active');
        const shuffled = activeCategories.sort(() => 0.5 - Math.random());
        const selectedCategories = shuffled.slice(0, 10);
        setCategories(selectedCategories);
      } catch (error) {
        console.error('Không thể tải danh mục:', error);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await ProductService.getAllProducts("ACTIVE");
        const allProducts = response.data.map(product => ({
          ...product,
          discountEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // Giả lập: giảm giá hết sau 24 giờ
        }));
        setProducts(allProducts);
      } catch (error) {
        console.error('Không thể tải sản phẩm:', error);
      }
    };

    Promise.all([fetchCategories(), fetchProducts()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const revealElements = () => {
      const productCards = document.querySelectorAll('.product-card');
      productCards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 100;
        if (isVisible) {
          card.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', revealElements);
    revealElements();

    return () => window.removeEventListener('scroll', revealElements);
  }, []);

  // Đồng hồ đếm ngược
  useEffect(() => {
    const timer = setInterval(() => {
      const newCountdown = {};
      topDiscountedProducts.forEach(product => {
        const timeLeft = new Date(product.discountEndTime) - Date.now();
        if (timeLeft > 0) {
          const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
          const seconds = Math.floor((timeLeft / 1000) % 60);
          newCountdown[product.id] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          newCountdown[product.id] = "Hết giờ";
        }
      });
      setCountdown(newCountdown);
    }, 1000);

    return () => clearInterval(timer);
  }, [products]);

  // Animation variants
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

  // Handle modal actions
  const openModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSelectedImage(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

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
        toast.error("Chỉ người dùng có vai trò USER mới có thể thêm sản phẩm vào giỏ hàng!", { autoClose: 1000 });
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
      toast.error(err.message || "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.", { autoClose: 1000 });
      console.error("Lỗi khi thêm vào giỏ hàng:", err);
    }
  };

  // Lấy 3 sản phẩm có mức giảm giá cao nhất
  const topDiscountedProducts = products
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 3);

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
      <div className="bg-gray-100">
        <ToastContainer position="top-right" autoClose={1000} hideProgressBar={false} />

        {/* Hero Banner */}
        <motion.div className="bg-pink-100 py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="container mx-auto px-4">
            <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                loop={true}
                pagination={{ clickable: true }}
                navigation
                className="w-full rounded-lg shadow-lg"
            >
              <SwiperSlide>
                <img src="https://happyphone.vn/wp-content/uploads/2024/10/Banner-Homepage-Website-A06.webp" alt="Banner 1" className="w-full h-auto object-cover rounded-lg" />
              </SwiperSlide>
              <SwiperSlide>
                <img src="https://happyphone.vn/wp-content/uploads/2025/02/bang_gia_s25u_giam_manh_web_hpp.webp" alt="Banner 2" className="w-full h-auto object-cover rounded-lg" />
              </SwiperSlide>
              <SwiperSlide>
                <img src="https://happyphone.vn/wp-content/uploads/2025/03/web_banner_camp-8_3_1920x790.webp" alt="Banner 3" className="w-full h-auto object-cover rounded-lg" />
              </SwiperSlide>
            </Swiper>
          </div>
        </motion.div>

        {/* Promotion Banners */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScrollReveal delay={100}>
              <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-lg p-5 text-white flex items-center justify-between h-40 hover:shadow-lg transition-shadow duration-300">
                <div>
                  <h3 className="text-xl font-bold">Đơn đầu số</h3>
                  <p className="text-3xl font-bold mt-2">16 tháng</p>
                  <p className="text-xl font-bold">Bảo hành 0%</p>
                </div>
                <div className="text-5xl font-bold">0%</div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="bg-blue-100 rounded-lg p-5 flex items-center justify-between h-40 hover:shadow-lg transition-shadow duration-300">
                <div className="flex-1">
                  <h3 className="text-blue-800 font-bold text-lg">iPhone Like New</h3>
                  <p className="text-sm mt-2">Bảo hành 12 tháng</p>
                </div>
                <div className="bg-red-600 text-white p-3 rounded text-center w-24">
                  <p className="text-xs">Giảm đến</p>
                  <p className="text-2xl font-bold">30%</p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-lg p-5 flex items-center justify-between h-40 hover:shadow-lg transition-shadow duration-300">
                <div className="flex-1">
                  <h3 className="text-red-600 font-bold text-lg">KHUYẾN MÃI HOT</h3>
                  <p className="text-sm mt-2">Giảm thêm 500.000đ</p>
                </div>
                <img src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60" alt="Promotion" className="h-20 w-20 object-cover rounded-lg" />
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Product Categories */}
        <ScrollReveal className="container mx-auto px-4 py-6">
          <h2 className="text-xl font-bold mb-4">Danh mục sản phẩm</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {categories.map((category, index) => (
                <motion.div key={category.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
                  <Link to={`/category/${category.id}`} className="bg-white rounded-lg w-full sm:w-24 md:w-28 h-28 flex flex-col items-center justify-center text-center hover:shadow-md transition transform hover:-translate-y-1 duration-300">
                    <img src={category.categoryImage} alt={category.name} className="w-12 h-12 object-contain mb-2" />
                    <span className="text-xs sm:text-sm font-medium truncate w-full px-2">{category.name}</span>
                  </Link>
                </motion.div>
            ))}
          </div>
        </ScrollReveal>

        {/* Flash Sale */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal delay={100}>
              <div className="bg-gradient-to-r from-pink-200 to-pink-100 rounded-lg p-5 hover:shadow-lg transition-shadow duration-300 h-80 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-center">Săn quà online - Nhân thích x2</h3>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-lg font-bold mb-2">Mua sắm online nhận ngay ưu đãi</p>
                  <p className="text-3xl font-bold text-red-600">10.000.000đ</p>
                </div>
                <motion.button className="bg-red-600 text-white px-4 py-2 rounded-full text-sm mx-auto w-40" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  XEM NGAY
                </motion.button>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="bg-gradient-to-r from-yellow-200 to-yellow-100 rounded-lg p-5 hover:shadow-lg transition-shadow duration-300 h-80 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-center">GIÁ SIÊU RẺ</h3>
                <div className="bg-white rounded-lg p-4 flex flex-col items-center">
                  <img src="https://images.unsplash.com/photo-1606041011872-596597976b25?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" alt="Flash Sale" className="h-32 object-contain" />
                  <p className="text-sm font-bold mt-2">Đồng hồ thông minh</p>
                  <p className="text-red-600 font-bold text-xl mt-1">1.990.000đ</p>
                </div>
                <motion.button className="bg-red-600 text-white px-4 py-2 rounded-full text-sm mx-auto w-40" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  MUA NGAY
                </motion.button>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="bg-gradient-to-r from-red-200 to-red-100 rounded-lg p-5 hover:shadow-lg transition-shadow duration-300 h-80 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-center">QUAY HÀNG SIÊU XỊN</h3>
                <div className="bg-white rounded-lg p-4 flex items-center justify-center">
                  <img src="https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" alt="Premium Product" className="h-32 object-contain" />
                </div>
                <motion.button className="bg-red-600 text-white px-4 py-2 rounded-full text-sm mx-auto w-40" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  KHÁM PHÁ NGAY
                </motion.button>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Featured Products */}
        <div className="container mx-auto px-4 py-6">
          <ScrollReveal>
            <div className="bg-white rounded-lg p-4 mb-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-red-600">Giá tốt, Nhanh tay. Số lượng ít!</h3>
                <Link to="/allProducts" className="text-blue-600 flex items-center text-sm group">
                  Xem tất cả <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <AnimatePresence>
                  {products.slice(0, 5).map((product) => (
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
                            className="product-card border rounded-lg p-3 hover:shadow-md transition transform hover:-translate-y-1 duration-300 block flex flex-col h-full"
                        >
                          <div className="relative flex-shrink-0">
                            <img
                                src={product.imageUrls[0] || "https://via.placeholder.com/150"}
                                alt={product.name}
                                className="w-full h-40 object-contain mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-80"
                                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                            />
                            {product.discount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs px-2 py-1 rounded">
                            -{product.discount}%
                          </span>
                            )}
                          </div>
                          <div className="flex flex-col flex-grow">
                            <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
                            <div className="mt-auto flex flex-col">
                          <span className="text-red-600 font-bold">
                            {formatPrice(calculateDiscountedPrice(product.price, product.discount))}
                          </span>
                              <span className="text-gray-500 text-xs line-through min-h-[1rem]">
                            {product.discount > 0 ? formatPrice(product.price) : ""}
                          </span>
                            </div>
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <span className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center mr-1">👍</span>
                              <span>Đánh giá tốt</span>
                            </div>
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
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Flash Sale Section */}
        <div className="container mx-auto px-4 py-6">
          {/* Tiêu đề Flash Sale */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold uppercase tracking-wider bg-gradient-to-r from-red-500 to-yellow-400 text-white py-3 rounded-lg shadow-md">
              ⚡ Flash Sale - Giảm Sốc ⚡
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topDiscountedProducts.map((product, index) => (
                <ScrollReveal key={product.id} delay={100 + index * 100}>
                  <Link to={`/productDetail/${product.id}`} className="block">
                    <div
                        className={`relative bg-gradient-to-r ${
                            index === 0 ? "from-red-500 to-red-700" : index === 1 ? "from-blue-500 to-blue-700" : "from-green-500 to-green-700"
                        } rounded-lg p-6 text-white flex flex-col justify-between h-full shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105`}
                    >
                      {/* Flash Sale & Đồng hồ đếm ngược */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 bg-black bg-opacity-60 px-4 py-1 rounded-full text-xs font-semibold animate-pulse">
                        ⚡ FLASH SALE: {countdown[product.id] || "Đang tính..."}
                      </div>

                      {/* Nội dung */}
                      <div className="mt-6 text-center">
                        <h3 className="text-lg font-bold">{product.name}</h3>
                        <p className="text-sm mb-2">🔥 Giảm {product.discount}% 🔥</p>
                        <div className="flex justify-center items-center space-x-1">
                <span className="text-2xl font-bold">
                  {(calculateDiscountedPrice(product.price, product.discount) / 1000000).toFixed(2)}
                </span>
                          <span className="text-sm">triệu</span>
                        </div>
                      </div>

                      {/* Ảnh & Nút */}
                      <div className="flex justify-between items-center mt-4">
                        <motion.button
                            className={`bg-white ${index === 1 ? "text-blue-600" : "text-red-600"} px-4 py-1.5 rounded-full text-xs shadow-md hover:shadow-lg transition-all`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                          MUA NGAY
                        </motion.button>
                        <img
                            src={product.imageUrls[0] || "https://via.placeholder.com/150"}
                            alt={product.name}
                            className="h-28 w-28 object-contain drop-shadow-md"
                            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                        />
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
            ))}
          </div>
        </div>


        {/* Featured Products (Duplicate Section) */}
        <div className="container mx-auto px-4 py-6">
          <ScrollReveal>
            <div className="bg-white rounded-lg p-4 mb-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-red-600">Giá tốt, Nhanh tay. Số lượng ít!</h3>
                <Link to="/allProducts" className="text-blue-600 flex items-center text-sm group">
                  Xem tất cả <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <AnimatePresence>
                  {products.slice(0, 5).map((product) => (
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
                            className="product-card border rounded-lg p-3 hover:shadow-md transition transform hover:-translate-y-1 duration-300 block flex flex-col h-full"
                        >
                          <div className="relative flex-shrink-0">
                            <img
                                src={product.imageUrls[0] || "https://via.placeholder.com/150"}
                                alt={product.name}
                                className="w-full h-40 object-contain mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-80"
                                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                            />
                            {product.discount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs px-2 py-1 rounded">
                            -{product.discount}%
                          </span>
                            )}
                          </div>
                          <div className="flex flex-col flex-grow">
                            <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
                            <div className="mt-auto flex flex-col">
                          <span className="text-red-600 font-bold">
                            {formatPrice(calculateDiscountedPrice(product.price, product.discount))}
                          </span>
                              <span className="text-gray-500 text-xs line-through min-h-[1rem]">
                            {product.discount > 0 ? formatPrice(product.price) : ""}
                          </span>
                            </div>
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <span className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center mr-1">👍</span>
                              <span>Đánh giá tốt</span>
                            </div>
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
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom Message */}
        <motion.div className="bg-gradient-to-r from-red-600 to-red-500 py-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="container mx-auto px-4 text-center text-white">
            <h3 className="text-xl font-bold">Ngày của bạn</h3>
            <p>Chọn ngay quà xinh</p>
            <motion.button className="bg-white text-red-600 px-4 py-2 rounded-full text-sm mt-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              KHÁM PHÁ NGAY
            </motion.button>
          </div>
        </motion.div>

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
                                className={`w-16 h-16 border rounded-lg cursor-pointer transition-all duration-200 ${selectedImage === index ? "border-red-500 shadow-md" : "border-gray-300 hover:border-gray-500"}`}
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
                        <span className="text-gray-600">{selectedProduct.category?.name}</span>
                      </div>
                      <div className="bg-gradient-to-r from-red-100 to-yellow-100 p-4 rounded-xl mt-6 shadow-md">
                        <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-red-600">
                        {formatPrice(calculateDiscountedPrice(selectedProduct.price, selectedProduct.discount))}
                      </span>
                          {selectedProduct.discount > 0 && (
                              <span className="text-gray-500 line-through text-lg">{formatPrice(selectedProduct.price)}</span>
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
                          <span className="w-16 text-center text-lg font-semibold text-gray-800">{quantity}</span>
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
                            className={`w-full bg-red-500 text-white py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-600 transition duration-300 shadow-md font-semibold ${selectedProduct.quantity === 0 ? "bg-gray-400 cursor-not-allowed" : ""}`}
                            disabled={selectedProduct.quantity === 0}
                        >
                          <FaShoppingCart size={16} />
                          <span>{selectedProduct.quantity > 0 ? "Thêm vào giỏ hàng" : "Hết hàng"}</span>
                        </button>
                        <button onClick={closeModal} className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition duration-300 font-medium">
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

export default HomePage;