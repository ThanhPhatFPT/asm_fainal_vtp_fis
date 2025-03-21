import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import CategoryService from '../service/CategoryService.js';
import ProductService from '../service/ProductService.js';

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // Lấy tất cả sản phẩm
        const response = await ProductService.getAllProducts("ACTIVE");
        const allProducts = response.data;

        // Chọn ngẫu nhiên một danh mục từ danh sách categories
        const activeCategories = await CategoryService.getAllCategories();
        const randomCategory = activeCategories[Math.floor(Math.random() * activeCategories.length)];

        // Lọc sản phẩm theo danh mục ngẫu nhiên
        const categoryProducts = allProducts.filter(product =>
            product.categoryId === randomCategory.id
        );

        // Nếu không đủ 5 sản phẩm trong danh mục, lấy thêm từ các danh mục khác
        let finalProducts = categoryProducts;
        if (categoryProducts.length < 5) {
          const remainingProducts = allProducts.filter(product =>
              product.categoryId !== randomCategory.id
          );
          const shuffledRemaining = remainingProducts.sort(() => 0.5 - Math.random());
          finalProducts = [
            ...categoryProducts,
            ...shuffledRemaining.slice(0, 5 - categoryProducts.length)
          ];
        }

        // Xáo trộn và lấy 5 sản phẩm
        const shuffledProducts = finalProducts.sort(() => 0.5 - Math.random());
        const selectedProducts = shuffledProducts.slice(0, 5);
        setProducts(selectedProducts);
      } catch (error) {
        console.error('Không thể tải sản phẩm:', error);
      }
    };

    Promise.all([fetchCategories(), fetchProducts()])
        .finally(() => setLoading(false));
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

    return () => {
      window.removeEventListener('scroll', revealElements);
    };
  }, []);

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  // Rest of the JSX remains the same
  return (
      <div className="bg-gray-100">
        {/* Hero Banner */}
        <motion.div
            className="bg-pink-100 py-6"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.5}}
        >
          <div className="container mx-auto px-4">
            <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                autoplay={{delay: 3000, disableOnInteraction: false}}
                loop={true}
                pagination={{clickable: true}}
                navigation
                className="w-full rounded-lg shadow-lg"
            >
              <SwiperSlide>
                <img
                    src="https://happyphone.vn/wp-content/uploads/2024/10/Banner-Homepage-Website-A06.webp"
                    alt="Banner 1"
                    className="w-full h-auto object-cover rounded-lg"
                />
              </SwiperSlide>
              <SwiperSlide>
                <img
                    src="https://happyphone.vn/wp-content/uploads/2025/02/bang_gia_s25u_giam_manh_web_hpp.webp"
                    alt="Banner 2"
                    className="w-full h-auto object-cover rounded-lg"
                />
              </SwiperSlide>
              <SwiperSlide>
                <img
                    src="https://happyphone.vn/wp-content/uploads/2025/03/web_banner_camp-8_3_1920x790.webp"
                    alt="Banner 3"
                    className="w-full h-auto object-cover rounded-lg"
                />
              </SwiperSlide>
            </Swiper>
          </div>
        </motion.div>

        {/* Promotion Banners */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScrollReveal delay={100}>
              <div
                  className="bg-gradient-to-r from-pink-500 to-red-500 rounded-lg p-5 text-white flex items-center justify-between h-40 hover:shadow-lg transition-shadow duration-300">
                <div>
                  <h3 className="text-xl font-bold">Đơn đầu số</h3>
                  <p className="text-3xl font-bold mt-2">16 tháng</p>
                  <p className="text-xl font-bold">Bảo hành 0%</p>
                </div>
                <div className="text-5xl font-bold">0%</div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div
                  className="bg-blue-100 rounded-lg p-5 flex items-center justify-between h-40 hover:shadow-lg transition-shadow duration-300">
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
              <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-lg p-5 flex items-center justify-between h-40 hover:shadow-lg transition-shadow duration-300">
                <div className="flex-1">
                  <h3 className="text-red-600 font-bold text-lg">KHUYẾN MÃI HOT</h3>
                  <p className="text-sm mt-2">Giảm thêm 500.000đ</p>
                </div>
                <img
                    src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60"
                    alt="Promotion"
                    className="h-20 w-20 object-cover rounded-lg"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Product Categories */}
        <ScrollReveal className="container mx-auto px-4 py-6">
          <h2 className="text-xl font-bold mb-4">Danh mục sản phẩm</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {categories.map((category, index) => (
                <motion.div
                    key={category.id}
                    initial={{opacity: 0, y: 20}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: index * 0.05}}
                >
                  <Link
                      key={category.id}
                      to={`/category/${category.id}`}
                      className="bg-white rounded-lg w-full sm:w-24 md:w-28 h-28 flex flex-col items-center justify-center text-center hover:shadow-md transition transform hover:-translate-y-1 duration-300"
                  >
                    <img
                        src={category.categoryImage}
                        alt={category.name}
                        className="w-12 h-12 object-contain mb-2"
                    />
                    <span className="text-xs sm:text-sm font-medium truncate w-full px-2">
                  {category.name}
                </span>
                  </Link>
                </motion.div>
            ))}
          </div>
        </ScrollReveal>



        {/* Flash Sale */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal delay={100}>
              <div
                  className="bg-gradient-to-r from-pink-200 to-pink-100 rounded-lg p-5 hover:shadow-lg transition-shadow duration-300 h-80 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-center">Săn quà online - Nhân thích x2</h3>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-lg font-bold mb-2">Mua sắm online nhận ngay ưu đãi</p>
                  <p className="text-3xl font-bold text-red-600">10.000.000đ</p>
                </div>
                <motion.button
                    className="bg-red-600 text-white px-4 py-2 rounded-full text-sm mx-auto w-40"
                    whileHover={{scale: 1.05}}
                    whileTap={{scale: 0.95}}
                >
                  XEM NGAY
                </motion.button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div
                  className="bg-gradient-to-r from-yellow-200 to-yellow-100 rounded-lg p-5 hover:shadow-lg transition-shadow duration-300 h-80 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-center">GIÁ SIÊU RẺ</h3>
                <div className="bg-white rounded-lg p-4 flex flex-col items-center">
                  <img
                      src="https://images.unsplash.com/photo-1606041011872-596597976b25?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
                      alt="Flash Sale"
                      className="h-32 object-contain"
                  />
                  <p className="text-sm font-bold mt-2">Đồng hồ thông minh</p>
                  <p className="text-red-600 font-bold text-xl mt-1">1.990.000đ</p>
                </div>
                <motion.button
                    className="bg-red-600 text-white px-4 py-2 rounded-full text-sm mx-auto w-40"
                    whileHover={{scale: 1.05}}
                    whileTap={{scale: 0.95}}
                >
                  MUA NGAY
                </motion.button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div
                  className="bg-gradient-to-r from-red-200 to-red-100 rounded-lg p-5 hover:shadow-lg transition-shadow duration-300 h-80 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-center">QUAY HÀNG SIÊU XỊN</h3>
                <div className="bg-white rounded-lg p-4 flex items-center justify-center">
                  <img
                      src="https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
                      alt="Premium Product"
                      className="h-32 object-contain"
                  />
                </div>
                <motion.button
                    className="bg-red-600 text-white px-4 py-2 rounded-full text-sm mx-auto w-40"
                    whileHover={{scale: 1.05}}
                    whileTap={{scale: 0.95}}
                >
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
                  Xem tất cả <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {products.map((product) => (
                    <Link to={`/productDetail/${product.id}`} key={product.id} className="block">
                      <div
                          className="product-card border rounded-lg p-3 hover:shadow-md transition transform hover:-translate-y-1 duration-300">
                        <div className="relative">
                          <img
                              src={product.imageUrls[0] || "https://via.placeholder.com/150"}
                              alt={product.name}
                              className="w-full h-40 object-contain mb-3"
                              onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                          />
                          {product.discount > 0 && (
                              <span className="absolute top-0 right-0 bg-red-600 text-white text-xs px-2 py-1 rounded">
                          -{product.discount}%
                        </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
                        <div className="flex flex-col">
                      <span className="text-red-600 font-bold">
                        {formatPrice(calculateDiscountedPrice(product.price, product.discount))}
                      </span>
                          {product.discount > 0 && (
                              <span className="text-gray-500 text-xs line-through">
                          {formatPrice(product.price)}
                        </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center mr-1">
                        👍
                      </span>
                          <span>Đánh giá tốt</span>
                        </div>
                      </div>
                    </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom Banners */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScrollReveal delay={100}>
              <div
                  className="bg-gradient-to-r from-red-500 to-red-700 rounded-lg p-5 text-white flex items-center shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">Galaxy M55 5G</h3>
                  <p className="text-sm mb-2">Siêu pin, Siêu sạc</p>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">3.7</span>
                    <span className="text-sm ml-1">triệu</span>
                  </div>
                  <motion.button
                      className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs mt-3 shadow-md hover:shadow-lg transition-all"
                      whileHover={{scale: 1.1}}
                      whileTap={{scale: 0.95}}
                  >
                    MUA NGAY
                  </motion.button>
                </div>
                <img
                    src="https://vatvostudio.vn/wp-content/uploads/2024/07/Galaxy-M55-5G-2.jpg"
                    alt="Galaxy M55 5G"
                    className="h-24 w-24 object-contain drop-shadow-md"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div
                  className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg p-5 text-white flex items-center shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">LAPTOP AI</h3>
                  <p className="text-sm mb-2">Trả góp 0%</p>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">10</span>
                    <span className="text-sm ml-1">triệu</span>
                  </div>
                  <motion.button
                      className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-xs mt-3 shadow-md hover:shadow-lg transition-all"
                      whileHover={{scale: 1.1}}
                      whileTap={{scale: 0.95}}
                  >
                    MUA NGAY
                  </motion.button>
                </div>
                <img
                    src="https://file.hstatic.net/1000069970/collection/son09582_a184e45a54ee475d9fc51fc424d0de0e_large.jpg"
                    alt="Laptop AI"
                    className="h-24 w-24 object-contain drop-shadow-md"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div
                  className="bg-gradient-to-r from-red-500 to-red-700 rounded-lg p-5 text-white flex items-center shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">Máy giặt sấy</h3>
                  <p className="text-sm mb-2">Giảm sốc</p>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">2.99</span>
                    <span className="text-sm ml-1">triệu</span>
                  </div>
                  <motion.button
                      className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs mt-3 shadow-md hover:shadow-lg transition-all"
                      whileHover={{scale: 1.1}}
                      whileTap={{scale: 0.95}}
                  >
                    MUA NGAY
                  </motion.button>
                </div>
                <img
                    src="https://dienmaytinphat.com/wp-content/uploads/2019/08/may-giat-electrolux-eww12853-thu-vien-7.jpg"
                    alt="Washing Machine"
                    className="h-24 w-24 object-contain drop-shadow-md"
                />
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
                  Xem tất cả <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {products.map((product) => (
                    <Link to={`/productDetail/${product.id}`} key={product.id} className="block">
                      <div
                          className="product-card border rounded-lg p-3 hover:shadow-md transition transform hover:-translate-y-1 duration-300">
                        <div className="relative">
                          <img
                              src={product.imageUrls[0] || "https://via.placeholder.com/150"}
                              alt={product.name}
                              className="w-full h-40 object-contain mb-3"
                              onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                          />
                          {product.discount > 0 && (
                              <span className="absolute top-0 right-0 bg-red-600 text-white text-xs px-2 py-1 rounded">
                          -{product.discount}%
                        </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
                        <div className="flex flex-col">
                      <span className="text-red-600 font-bold">
                        {formatPrice(calculateDiscountedPrice(product.price, product.discount))}
                      </span>
                          {product.discount > 0 && (
                              <span className="text-gray-500 text-xs line-through">
                          {formatPrice(product.price)}
                        </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center mr-1">
                        👍
                      </span>
                          <span>Đánh giá tốt</span>
                        </div>
                      </div>
                    </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom Message */}
        <motion.div
            className="bg-gradient-to-r from-red-600 to-red-500 py-4"
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.5}}
        >
          <div className="container mx-auto px-4 text-center text-white">
            <h3 className="text-xl font-bold">Ngày của bạn</h3>
            <p>Chọn ngay quà xinh</p>
            <motion.button
                className="bg-white text-red-600 px-4 py-2 rounded-full text-sm mt-2"
                whileHover={{scale: 1.05}}
                whileTap={{scale: 0.95}}
            >
              KHÁM PHÁ NGAY
            </motion.button>
          </div>
        </motion.div>
      </div>
  );
};

export default HomePage;