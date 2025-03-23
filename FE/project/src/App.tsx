import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, ChevronDown, Bell, ArrowLeft } from 'lucide-react';
import { FaFacebookF, FaTiktok, FaInstagram } from "react-icons/fa";
import { motion } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductDetail from './pages/ProductDetail.tsx';
import CartPage from './pages/CartPage.tsx';
import CheckoutPage from './pages/CheckoutPage.tsx';
import SearchBar from './components/SearchBar.tsx';
import { logout, getToken } from './service/authService.js';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Categories from './pages/Categories';
import Products from './pages/Products';
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import CategoryService from "././service/CategoryService.js";
import AllProducts from "./pages/AllProducts.tsx";
import ProductsByCategory from "./pages/ProductsByCategory.tsx";
import Orders from "./pages/Orders.tsx";
import OrderHistory from "./pages/OrderHistory.tsx";
import TaskList from "./pages/TaskList.tsx";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import EditProfilePage from "./pages/EditProfilePage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";

// Tạo AuthContext
interface AuthContextType {
  isLoggedIn: boolean;
  userEmail: string | null;
  userRole: string | null;
  setAuthData: (data: (prev) => any) => void;
  handleLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchAuthStatus = async () => {
    const token = getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        const role = decodedToken.role || decodedToken.authorities || 'USER';
        const storedEmail = localStorage.getItem('userEmail');
        setIsLoggedIn(true);
        setUserRole(role);
        setUserEmail(storedEmail);
      } catch (error) {
        console.error('Error verifying token:', error);
        setIsLoggedIn(false);
        setUserRole(null);
        setUserEmail(null);
        localStorage.removeItem('userEmail');
      }
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      setUserEmail(null);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
    const interval = setInterval(fetchAuthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const setAuthData = (data: { isLoggedIn: boolean; userEmail: string | null; userRole: string | null }) => {
    setIsLoggedIn(data.isLoggedIn);
    setUserEmail(data.userEmail);
    setUserRole(data.userRole);
    if (data.userEmail) {
      localStorage.setItem('userEmail', data.userEmail);
    } else {
      localStorage.removeItem('userEmail');
    }
  };

  const handleLogout = () => {
    logout();
    setAuthData({ isLoggedIn: false, userEmail: null, userRole: null });
  };

  return (
      <AuthContext.Provider value={{ isLoggedIn, userEmail, userRole, setAuthData, handleLogout }}>
        {children}
      </AuthContext.Provider>
  );
};

// AnimatedRoutes với hiệu ứng chuyển trang
const AnimatedRoutes = () => {
  const location = useLocation();

  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

  return (
      <div className="min-h-screen flex flex-col">
        <Header /> {/* Header nằm ngoài để cố định */}
        <main className="flex-grow pt-24 mt-3"> {/* Padding để tránh dính Header và Footer */}
          <Routes location={location}>
            <Route
                path="/"
                element={
                  <motion.div
                      key="home"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.5 }}
                  >
                    <HomePage />
                  </motion.div>
                }
            />
              <Route
                  path="/productDetail/:id" // Added :id to capture the product ID
                  element={
                      <motion.div
                          key="productDetail"
                          variants={pageVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.5 }}
                      >
                          <ProductDetail />
                      </motion.div>
                  }
              />
              <Route
                  path="/orders" // Added :id to capture the product ID
                  element={
                      <motion.div
                          key="productDetail"
                          variants={pageVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.5 }}
                      >
                          <OrderHistory />
                      </motion.div>
                  }
              />
              <Route
                  path="/category/:categoryId"
                  element={
                      <motion.div
                          key="category"
                          variants={pageVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.5 }}
                      >
                          <ProductsByCategory />
                      </motion.div>
                  }
              />
              <Route
                  path="/allProducts"
                  element={
                      <motion.div
                          key="productDetail"
                          variants={pageVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.5 }}
                      >
                          <AllProducts />
                      </motion.div>
                  }
              />
            <Route
                path="/cartPage"
                element={
                  <motion.div
                      key="cartPage"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.5 }}
                  >
                    <CartPage />
                  </motion.div>
                }
            />
            <Route
                path="/checkoutPage"
                element={
                  <motion.div
                      key="checkoutPage"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.5 }}
                  >
                    <CheckoutPage />
                  </motion.div>
                }
            />
            <Route
                path="/login"
                element={
                  <motion.div
                      key="login"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.5 }}
                  >
                    <LoginPage />
                  </motion.div>
                }
            />
            <Route
                path="/register"
                element={
                  <motion.div
                      key="register"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.5 }}
                  >
                    <RegisterPage />
                  </motion.div>
                }
            />

              <Route
                  path="/forgot-password"
                  element={
                      <motion.div
                          key="login"
                          variants={pageVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.5 }}
                      >
                          <ForgotPasswordPage />
                      </motion.div>
                  }
              />
              <Route
                  path="/reset-password"
                  element={
                      <motion.div
                          key="reset-password"
                          variants={pageVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.5 }}
                      >
                          <ResetPasswordPage />
                      </motion.div>
                  }
              />

              <Route
                  path="/update-profile"
                  element={
                      <motion.div
                          key="login"
                          variants={pageVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.5 }}
                      >
                          <EditProfilePage />
                      </motion.div>
                  }
              />
            <Route
                path="/orders"
                element={
                  <motion.div
                      key="orders"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.5 }}
                  >
                    <OrderManagement />
                  </motion.div>
                }
            />
          </Routes>
        </main>
        <Footer /> {/* Footer nằm ngoài để cố định */}
      </div>
  );
};

// ProtectedRoute component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { userRole, isLoggedIn } = useAuth();
  const token = getToken();

  if (!token || !isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'ADMIN') {
    return <Navigate to="/404" replace />;
  }

  return children;
};

// Trang 404
const NotFoundPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, when: 'beforeChildren', staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const bounceVariants = {
    animate: { y: [0, -20, 0], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } },
  };

  return (
      <motion.div
          className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center px-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
      >
        <div className="text-center text-white">
          <motion.h1 className="text-9xl md:text-[12rem] font-extrabold tracking-tight" variants={bounceVariants} animate="animate">
            404
          </motion.h1>
          <motion.h2 className="mt-4 text-3xl md:text-5xl font-bold" variants={itemVariants}>
            Oops! Trang không tìm thấy
          </motion.h2>
          <motion.p className="mt-4 text-lg md:text-xl text-gray-300 max-w-md mx-auto" variants={itemVariants}>
            Có vẻ như bạn đã lạc đường. Đừng lo, chúng tôi sẽ đưa bạn trở lại đúng hướng!
          </motion.p>
          <motion.div variants={itemVariants} className="mt-8">
            <Link
                to="/"
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft size={20} className="mr-2" />
              Quay về trang chủ
            </Link>
          </motion.div>
        </div>
      </motion.div>
  );
};

// Giả lập component OrderManagement
const OrderManagement: React.FC = () => {
  return (
      <div className="min-h-screen p-6">
        <h1 className="text-3xl font-bold">Quản lý đơn hàng</h1>
        <p>Đây là trang quản lý đơn hàng của người dùng.</p>
      </div>
  );
};
const pageVariants = {
  initial: { opacity: 0, x: 100 }, // Trang bắt đầu từ bên phải, mờ dần
  animate: { opacity: 1, x: 0 },   // Trang xuất hiện đầy đủ
  exit: { opacity: 0, x: -100 },   // Trang rời đi về bên trái
};

function App() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
      <AuthProvider>
        <Router>
          <Routes>
            {/* Khu vực dành cho admin */}
            <Route
                path="/admin/*"
                element={
                  <motion.div
                      key="admin"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.5 }}
                  >
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  </motion.div>
                }
            >
              <Route
                  index
                  element={
                    <motion.div
                        key="dashboard"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.5 }}
                    >
                      <Dashboard />
                    </motion.div>
                  }
              />
              <Route
                  path="users"
                  element={
                    <motion.div
                        key="users"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.5 }}
                    >
                      <Users />
                    </motion.div>
                  }
              />
              <Route
                  path="categories"
                  element={
                    <motion.div
                        key="categories"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.5 }}
                    >
                      <Categories />
                    </motion.div>
                  }
              />
              <Route
                  path="products"
                  element={
                    <motion.div
                        key="products"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.5 }}
                    >
                      <Products />
                    </motion.div>
                  }
              />
                <Route
                    path="orders"
                    element={
                        <motion.div
                            key="users"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.5 }}
                        >
                            <Orders />
                        </motion.div>
                    }
                />

                <Route
                    path="taskList"
                    element={
                        <motion.div
                            key="taskList"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.5 }}
                        >
                            <TaskList />
                        </motion.div>
                    }
                />
            </Route>

            {/* Trang 404 */}
            <Route
                path="/404"
                element={
                  <motion.div
                      key="notFound"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.5 }}
                  >
                    <NotFoundPage />
                  </motion.div>
                }
            />

            {/* Khu vực người dùng với Header & Footer */}
            <Route
                path="*"
                element={
                  <div className="min-h-screen flex flex-col">
                    <main className="flex-grow">
                      <AnimatedRoutes />
                    </main>
                  </div>
                }
            />
          </Routes>
        </Router>
      </AuthProvider>
  );
}

// Header component
const Header: React.FC = () => {
    const { isLoggedIn, userEmail, userRole, handleLogout } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [categories, setCategories] = useState([]); // State cho danh mục
    const [loading, setLoading] = useState(false);

    // Xử lý scroll để thay đổi style header
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Lấy danh sách danh mục từ API, giới hạn 10 danh mục
    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const data = await CategoryService.getAllCategories();
                const activeCategories = data
                    .filter((category) => category.status === "active")
                    .sort(() => Math.random() - 0.5) // Trộn ngẫu nhiên
                    .slice(0, 14); // Giới hạn tối đa 14 danh mục
                setCategories(activeCategories);
            } catch (error) {
                console.error("Không thể tải danh mục:", error);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);


    const onLogout = () => {
        handleLogout();
        navigate("/login");
    };

    return (
        <header
            className={`fixed w-full top-0 z-50 transition-all duration-300 ${
                isScrolled ? "bg-red-700 shadow-lg py-2" : "bg-red-600 py-4"
            }`}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                <div className="flex items-center">
                    <Link to="/" className="mr-6">
                        <img src="https://cdn2.fptshop.com.vn/unsafe/150x0/filters:quality(100)/small/fptshop_logo_c5ac91ae46.png" alt="FPT Shop"  />
                    </Link>
                    <div className="relative">
                        <SearchBar />
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Link to="#" className="flex items-center hover:text-yellow-300 transition-colors text-white">
                        <Bell size={20} className="mr-1" />
                        <span className="hidden md:inline">Thông báo</span>
                    </Link>
                    <Link to="/cartPage" className="flex items-center hover:text-yellow-300 transition-colors text-white">
                        <ShoppingCart size={20} className="mr-1" />
                        <span className="hidden md:inline">Giỏ hàng</span>
                    </Link>
                    {isLoggedIn ? (
                        <div className="relative">
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-800 cursor-pointer transition-colors text-white"
                                onMouseEnter={() => setIsDropdownOpen(true)}
                            >
                                <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail || "User")}`}
                                    alt={userEmail || "User Avatar"}
                                />
                                <span className="hidden md:inline font-medium truncate max-w-[150px]">
                  {userEmail || "Người dùng"}
                </span>
                            </div>
                            {isDropdownOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-lg z-20 transition-all duration-200"
                                    onMouseEnter={() => setIsDropdownOpen(true)}
                                    onMouseLeave={() => setIsDropdownOpen(false)}
                                >
                                    <div className="py-2">
                                        <div className="px-4 py-2 text-sm text-gray-600 border-b">
                                            Xin chào, <b>{userEmail}</b>
                                        </div>
                                        {userRole === "USER" && (
                                            <>
                                                <Link
                                                    to="/orders"
                                                    className="block px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition rounded-md"
                                                >
                                                    Quản lý đơn hàng
                                                </Link>

                                                <Link
                                                    to="/update-profile"
                                                    className="block px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition rounded-md"
                                                >
                                                    Quản lý tài khoản
                                                </Link>
                                            </>
                                        )}

                                        {userRole === "ADMIN" && (
                                          <>
                                              <Link
                                                  to="/admin"
                                                  className="block px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition rounded-md"
                                              >
                                                  Trang quản trị
                                              </Link>
                                              <Link
                                                  to="/update-profile"
                                                  className="block px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition rounded-md"
                                              >
                                                  Quản lý tài khoản
                                              </Link>
                                          </>
                                        )}
                                        <button
                                            onClick={onLogout}
                                            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition rounded-md"
                                        >
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3">
                            <Link
                                to="/login"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-800 transition text-white"
                            >
                                <User size={22} />
                                <span className="hidden md:inline font-medium">Đăng nhập</span>
                            </Link>
                            <span className="hidden md:inline text-gray-300">|</span>
                            <Link
                                to="/register"
                                className="hidden md:inline px-3 py-2 rounded-lg hover:bg-red-800 transition font-medium text-white"
                            >
                                Đăng ký
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div
                className={`bg-red-700 transition-all duration-300 ${
                    isScrolled ? "h-0 opacity-0 overflow-hidden" : "h-auto opacity-100"
                }`}
            >
                <div className="container mx-auto px-4 py-1">
                    <div className="flex items-center space-x-6 text-sm overflow-x-auto whitespace-nowrap text-white">
                        <Link to="/allProducts" className="flex items-center py-1 hover:text-yellow-300 transition-colors">
                            <Menu size={16} className="mr-1" />
                            <span>Tất cả danh mục</span>
                        </Link>
                        {loading ? (
                            <span className="text-gray-300">Đang tải danh mục...</span>
                        ) : categories.length > 0 ? (
                            categories.map((category) => (
                                <Link
                                    key={category.id}
                                    to={`/category/${category.id}`}
                                    className="hover:text-yellow-300 transition-colors"
                                >
                                    {category.name}
                                </Link>
                            ))
                        ) : (
                            <span className="text-gray-300">Không có danh mục</span>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

// Footer component
const Footer: React.FC = () => (
    <footer className="bg-red-600 text-white py-6">
      <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                  <h3 className="font-bold text-lg mb-3">Hỗ trợ khách hàng</h3>
                  <ul className="space-y-2 text-sm">
                      <li><Link to="#" className="hover:text-yellow-300 transition-colors">Thông tin mua hàng</Link>
                      </li>
                      <li><Link to="#" className="hover:text-yellow-300 transition-colors">Hình thức thanh toán</Link>
                      </li>
                      <li><Link to="#" className="hover:text-yellow-300 transition-colors">Chính sách bảo hành</Link>
                      </li>
                      <li><Link to="#" className="hover:text-yellow-300 transition-colors">Chính sách đổi trả</Link>
                      </li>
                  </ul>
              </div>
              <div>
                  <h3 className="font-bold text-lg mb-3">Về chúng tôi</h3>
                  <ul className="space-y-2 text-sm">
                      <li><Link to="#" className="hover:text-yellow-300 transition-colors">Giới thiệu công ty</Link>
                      </li>
                      <li><Link to="#" className="hover:text-yellow-300 transition-colors">Tuyển dụng</Link></li>
                      <li><Link to="#" className="hover:text-yellow-300 transition-colors">Liên hệ</Link></li>
                  </ul>
              </div>
              <div>
                  <h3 className="font-bold text-lg mb-3">Kết nối với chúng tôi</h3>
                  <div className="flex space-x-3 mt-2">
                      {/* Facebook */}
                      <a
                          href="https://www.facebook.com/thanh.phat.963/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white text-blue-600 rounded-full p-2 hover:bg-blue-100 transition-colors"
                      >
                          <FaFacebookF className="w-5 h-5"/>
                      </a>

                      {/* TikTok */}
                      <a
                          href="https://www.tiktok.com/@tphats2003?_r=1&_d=secCgYIASAHKAESP..."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors"
                      >
                          <FaTiktok className="w-5 h-5"/>
                      </a>

                      {/* Instagram */}
                      <a
                          href="https://www.instagram.com/thanh.phat.963/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white text-pink-600 rounded-full p-2 hover:bg-pink-200 transition-colors"
                      >
                          <FaInstagram className="w-5 h-5"/>
                      </a>
                  </div>
              </div>
              <div>
                  <h3 className="font-bold text-lg mb-3">Liên hệ</h3>
                  <p className="text-sm">Hotline: 0862287480</p>
                  <p className="text-sm">Email: supportfpt@com.vn</p>
              </div>
          </div>
          <div className="mt-8 pt-6 border-t border-red-500 text-center text-sm">
              <p>© 2025 FPT Shop. Tất cả quyền được bảo lưu.</p>
          </div>
      </div>
    </footer>
);

export default App;