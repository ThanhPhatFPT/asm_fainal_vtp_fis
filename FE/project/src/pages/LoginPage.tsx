import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { login, getToken } from '../service/authService.js';
import { jwtDecode } from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../App';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuthData, isLoggedIn, userRole } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    console.log('LoginPage mounted - isLoggedIn:', isLoggedIn, 'userRole:', userRole);
    if (isLoggedIn) {
      // Nếu đã đăng nhập, chuyển hướng ngay lập tức
      navigate(userRole === 'ADMIN' ? '/admin' : '/');
    }
  }, [isLoggedIn, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login(email, password);
      console.log('Login response:', response);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const token = response.token || getToken();
      if (token) {
        const decodedToken: any = jwtDecode(token);
        const userRole = decodedToken.role || decodedToken.authorities || 'USER';
        console.log('Before setAuthData:', { isLoggedIn: true, userEmail: email, userRole });
        setAuthData({
          isLoggedIn: true,
          userEmail: email,
          userRole,
        });
        console.log('After setAuthData called');

        toast.success(response.message || 'Đăng nhập thành công!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        setTimeout(() => {
          navigate(userRole === 'ADMIN' ? '/admin' : '/');
        }, 1000);
      } else {
        throw new Error('Không tìm thấy token sau khi đăng nhập');
      }
    } catch (err: any) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const errorMessage = err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  return (
      <motion.div
          className="min-h-screen  relative"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
      >
        <div className="container mx-auto px-4 mt-10">
          <motion.div
              className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden"
              variants={itemVariants}
          >
            <div className="bg-red-600 py-4 px-6">
              <h2 className="text-xl font-bold text-white">Đăng nhập</h2>
              <p className="text-red-100 text-sm">Đăng nhập để mua sắm và nhận nhiều ưu đãi</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {error && (
                    <motion.div
                        className="mb-4 p-3 bg-red-100 text-red-700 rounded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                      {error}
                    </motion.div>
                )}

                <motion.div className="mb-4" variants={itemVariants}>
                  <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                    Email hoặc số điện thoại
                  </label>
                  <div className="relative">
                    <input
                        type="text"
                        id="email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                        placeholder="Nhập email hoặc số điện thoại"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <Smartphone
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                  </div>
                </motion.div>

                <motion.div className="mb-6" variants={itemVariants}>
                  <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>

                <motion.div className="flex items-center justify-between mb-6" variants={itemVariants}>
                  <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="remember"
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded transition-all duration-300"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        disabled={loading}
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                      Ghi nhớ đăng nhập
                    </label>
                  </div>
                  <Link
                      to="/forgot-password"
                      className="text-sm text-red-600 hover:underline transition-all duration-300"
                  >
                    Quên mật khẩu?
                  </Link>
                </motion.div>

                <motion.button
                    type="submit"
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-300 disabled:bg-red-400"
                    variants={itemVariants}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                </motion.button>
              </form>

              <motion.div className="mt-6 text-center" variants={itemVariants}>
                <p className="text-sm text-gray-600">
                  Bạn chưa có tài khoản?
                  <Link
                      to="/register"
                      className="text-red-600 hover:underline ml-1 transition-all duration-300"
                  >
                    Đăng ký ngay
                  </Link>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {loading && (
            <motion.div
                className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={modalVariants}
            >
              <motion.div
                  className="bg-gradient-to-br from-white to-gray-100 rounded-xl p-8 shadow-2xl flex flex-col items-center w-80"
                  variants={modalVariants}
              >
                <svg className="animate-spin h-12 w-12 text-transparent" viewBox="0 0 36 36">
                  <circle
                      className="opacity-20"
                      cx="18"
                      cy="18"
                      r="16"
                      stroke="#e5e7eb"
                      strokeWidth="4"
                      fill="none"
                  />
                  <circle
                      cx="18"
                      cy="18"
                      r="16"
                      stroke="url(#gradient)"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray="100"
                      strokeDashoffset="25"
                      strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                </svg>
                <motion.p
                    className="text-gray-800 text-xl font-semibold mt-6"
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  Đang đăng nhập
                </motion.p>
                <p className="text-gray-500 text-sm mt-2">Vui lòng đợi...</p>
              </motion.div>
            </motion.div>
        )}

        <ToastContainer />
      </motion.div>
  );
};

export default LoginPage;