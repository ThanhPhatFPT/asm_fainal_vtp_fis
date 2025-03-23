import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Edit2, Atom } from 'lucide-react';
import { motion } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../App';

const EditProfilePage: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();
    const { setAuthData, isLoggedIn } = useAuth();

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!isLoggedIn) {
            navigate('/login');
        } else {
            const token = Cookies.get('token');
            if (token) {
                try {
                    const decodedToken: any = jwtDecode(token);
                    console.log('Decoded token:', decodedToken);
                    setFullName(decodedToken.fullName || '');
                    setEmail(decodedToken.sub || decodedToken.email || '');
                } catch (err) {
                    console.error('Error decoding token:', err);
                    setError('Không thể giải mã thông tin người dùng từ token.');
                    navigate('/login');
                }
            } else {
                setError('Không tìm thấy token trong cookies.');
                navigate('/login');
            }
        }
    }, [isLoggedIn, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const updatedData = { fullName, email, password };
            const token = Cookies.get('token');
            const response = await fetch('http://localhost:8080/api/auth/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updatedData),
            });

            let result;
            if (response.ok) {
                result = await response.json();
                console.log('Update profile response:', result);
            } else {
                const text = await response.text();
                console.error('Error response:', text);
                throw new Error(text || `Lỗi từ server: ${response.status}`);
            }

            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Cập nhật auth data
            setAuthData((prev) => ({
                ...prev,
                userEmail: email,
                userId: result.user.userId,
            }));

            // Hiển thị thông báo thành công
            setSuccess(result.message || 'Cập nhật hồ sơ thành công!');
            toast.success(result.message || 'Cập nhật hồ sơ thành công! Bạn sẽ được đăng xuất ngay sau đây...', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });

            // Xóa token và đăng xuất
            setTimeout(() => {
                Cookies.remove('token'); // Xóa token từ cookies
                setAuthData((prev) => ({
                    ...prev,
                    isLoggedIn: false, // Đặt lại trạng thái đăng nhập
                    userEmail: null,
                    userId: null,
                }));
                navigate('/login'); // Chuyển hướng về trang đăng nhập
            }, 3000); // Chờ 3 giây để người dùng thấy thông báo

            setIsEditing(false);
        } catch (err: any) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const errorMessage = err.message || 'Cập nhật hồ sơ thất bại. Vui lòng thử lại.';
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
        visible: { opacity: 1, transition: { duration: 0.5, when: 'beforeChildren', staggerChildren: 0.1 } },
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
            className="min-h-screen relative bg-gray-50"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="container mx-auto px-4 py-10">
                {/* Breadcrumb */}
                <div className="text-sm text-red-700 mb-6 flex items-center space-x-2">
                    <Link to="/" className="hover:underline">Home</Link>
                    <span>/</span>
                    <Link to="/profile" className="hover:underline">User</Link>
                    <span>/</span>
                    <span>Profile</span>
                    <motion.div
                        className="ml-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                        <Atom className="h-5 w-5 text-red-700" />
                    </motion.div>
                </div>

                <motion.div
                    className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden flex"
                    variants={itemVariants}
                >
                    {/* Cột trái - Ảnh đại diện và thông tin cơ bản */}
                    <div className="w-1/3 bg-red-50 p-8 flex flex-col items-center justify-center">
                        <img
                            className="h-28 w-28 rounded-full object-cover mb-4 border-4 border-red-700"
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(email || "User")}&background=fee2e2&color=991b1b`}
                            alt={email || "User Avatar"}
                        />
                        <p className="text-gray-800 font-semibold text-xl">{fullName || 'Người dùng'}</p>
                        <p className="text-gray-600 text-sm mt-1">{email}</p>
                    </div>

                    {/* Cột phải - Thông tin chi tiết hoặc form chỉnh sửa */}
                    <div className="w-2/3 p-8">
                        <div className="bg-red-700 py-4 px-6 mb-6 rounded-t-lg">
                            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                                <User size={24} />
                                <span>{isEditing ? 'Chỉnh sửa hồ sơ' : 'Thông tin hồ sơ'}</span>
                            </h2>
                        </div>

                        {isEditing ? (
                            // Form chỉnh sửa
                            <div>
                                {success && (
                                    <motion.div
                                        className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center space-x-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <Atom className="h-5 w-5 text-green-700" />
                                        <span>{success}</span>
                                    </motion.div>
                                )}
                                {error && (
                                    <motion.div
                                        className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center space-x-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <Atom className="h-5 w-5 text-red-700" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <motion.div className="mb-4" variants={itemVariants}>
                                        <label htmlFor="fullName" className="block text-gray-700 text-sm font-medium mb-2">
                                            Họ và tên
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="fullName"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-700 focus:border-red-700 transition-all duration-300"
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
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-700 focus:border-red-700 transition-all duration-300"
                                                placeholder="Nhập email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                disabled={loading}
                                            />
                                            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        </div>
                                    </motion.div>

                                    <motion.div className="mb-6" variants={itemVariants}>
                                        <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                                            Mật khẩu mới (để trống nếu không đổi)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="password"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-700 focus:border-red-700 transition-all duration-300"
                                                placeholder="Nhập mật khẩu mới"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
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

                                    <div className="flex space-x-3">
                                        <motion.button
                                            type="submit"
                                            className="bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-opacity-50 transition-colors duration-300 disabled:bg-red-500 flex items-center space-x-2"
                                            variants={itemVariants}
                                            whileHover={{ scale: loading ? 1 : 1.02 }}
                                            whileTap={{ scale: loading ? 1 : 0.98 }}
                                            disabled={loading}
                                        >
                                            <Atom className="h-5 w-5" />
                                            <span>{loading ? 'Đang xử lý...' : 'Lưu thay đổi'}</span>
                                        </motion.button>
                                        <motion.button
                                            type="button"
                                            className="border border-red-700 text-red-700 px-6 py-2 rounded-lg hover:bg-red-50 transition flex items-center space-x-2"
                                            onClick={() => setIsEditing(false)}
                                            variants={itemVariants}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Atom className="h-5 w-5" />
                                            <span>Hủy</span>
                                        </motion.button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            // Chế độ xem thông tin
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                                        <User size={20} className="text-red-700" />
                                        <span>Thông tin cá nhân</span>
                                    </h2>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center space-x-1 text-red-700 hover:text-red-800 transition"
                                    >
                                        <Edit2 size={16} />
                                        <span>Chỉnh sửa</span>
                                    </button>
                                </div>
                                {success && (
                                    <motion.div
                                        className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center space-x-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <Atom className="h-5 w-5 text-green-700" />
                                        <span>{success}</span>
                                    </motion.div>
                                )}
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3">
                                        <User size={20} className="text-red-700" />
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">HỌ VÀ TÊN</p>
                                            <p className="text-gray-800 text-lg">{fullName || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Mail size={20} className="text-red-700" />
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">EMAIL</p>
                                            <p className="text-gray-800 text-lg">{email || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
                        className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center w-80"
                        variants={modalVariants}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        >
                            <Atom className="h-12 w-12 text-red-700" />
                        </motion.div>
                        <motion.p
                            className="text-gray-800 text-xl font-semibold mt-6"
                            animate={{ opacity: [1, 0.7, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            Đang cập nhật
                        </motion.p>
                        <p className="text-gray-500 text-sm mt-2">Vui lòng đợi...</p>
                    </motion.div>
                </motion.div>
            )}

            <ToastContainer />
        </motion.div>
    );
};

export default EditProfilePage;