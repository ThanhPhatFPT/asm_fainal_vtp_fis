import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Smartphone, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { register } from '../service/authService.js'; // Import hàm register
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface RegisterPageProps {
  setIsLoggedIn: (value: boolean) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ setIsLoggedIn }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false); // Thêm state loading
  const [error, setError] = useState<string | null>(null); // Thêm state error
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp!');
      toast.error('Mật khẩu không khớp!', { position: "top-right", autoClose: 3000 });
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await register(fullName, email, password, phone);

      // Giả lập loading 2 giây
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Giả sử backend không trả về token ngay sau khi đăng ký
      toast.success(response.message || 'Đăng ký thành công!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => navigate('/login'), 1000); // Chuyển hướng về trang login sau 1 giây
    } catch (err: any) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const errorMessage = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      setError(errorMessage);
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
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
        when: "beforeChildren",
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
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  return (
      <motion.div
          className="min-h-screen relative"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
      >
        <div className="container mx-auto px-4 my-10 ">
          <motion.div
              className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden"
              variants={itemVariants}
          >
            <div className="bg-red-600 py-4 px-6">
              <h2 className="text-xl font-bold text-white">Đăng ký tài khoản</h2>
              <p className="text-red-100 text-sm">Đăng ký để mua sắm và nhận nhiều ưu đãi</p>
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
                  <label htmlFor="fullName" className="block text-gray-700 text-sm font-medium mb-2">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <input
                        type="text"
                        id="fullName"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                        placeholder="Nhập họ và tên"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </motion.div>

                <motion.div className="mb-4" variants={itemVariants}>
                  <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                        type="email"
                        id="email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                        placeholder="Nhập email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </motion.div>

                <motion.div className="mb-4" variants={itemVariants}>
                  <label htmlFor="phone" className="block text-gray-700 text-sm font-medium mb-2">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <input
                        type="tel"
                        id="phone"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                        placeholder="Nhập số điện thoại"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <Smartphone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </motion.div>

                <motion.div className="mb-4" variants={itemVariants}>
                  <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
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

                <motion.div className="mb-6" variants={itemVariants}>
                  <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                        placeholder="Xác nhận mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>

                <motion.div className="mb-6" variants={itemVariants}>
                  <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="terms"
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded transition-all duration-300"
                        checked={agreeTerms}
                        onChange={() => setAgreeTerms(!agreeTerms)}
                        disabled={loading}
                        required
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                      Tôi đồng ý với <Link to="#" className="text-red-600 hover:underline">Điều khoản</Link> và{' '}
                      <Link to="#" className="text-red-600 hover:underline">Chính sách bảo mật</Link>
                    </label>
                  </div>
                </motion.div>

                <motion.button
                    type="submit"
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-300 disabled:bg-red-400"
                    disabled={!agreeTerms || loading}
                    variants={itemVariants}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng ký'}
                </motion.button>
              </form>

              <motion.div className="mt-6 text-center" variants={itemVariants}>
                <p className="text-sm text-gray-600">
                  Bạn đã có tài khoản?
                  <Link to="/login" className="text-red-600 hover:underline ml-1 transition-all duration-300">
                    Đăng nhập
                  </Link>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Modal Loading */}
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
                <div className="relative mb-6">
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
                </div>
                <motion.p
                    className="text-gray-800 text-xl font-semibold"
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  Đang đăng ký
                </motion.p>
                <p className="text-gray-500 text-sm mt-2">Vui lòng đợi...</p>
              </motion.div>
            </motion.div>
        )}

        <ToastContainer />
      </motion.div>
  );
};

export default RegisterPage;