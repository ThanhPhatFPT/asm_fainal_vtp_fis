import { Link } from "react-router-dom";

const FooterHome: React.FC = () => (
    <footer className="bg-red-600 text-white py-6 mt-auto">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Hỗ trợ khách hàng */}
                <div>
                    <h3 className="font-bold text-lg mb-3">Hỗ trợ khách hàng</h3>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="#" className="hover:text-yellow-300">Thông tin mua hàng</Link></li>
                        <li><Link to="#" className="hover:text-yellow-300">Hình thức thanh toán</Link></li>
                        <li><Link to="#" className="hover:text-yellow-300">Chính sách bảo hành</Link></li>
                        <li><Link to="#" className="hover:text-yellow-300">Chính sách đổi trả</Link></li>
                    </ul>
                </div>

                {/* Về chúng tôi */}
                <div>
                    <h3 className="font-bold text-lg mb-3">Về chúng tôi</h3>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="#" className="hover:text-yellow-300">Giới thiệu công ty</Link></li>
                        <li><Link to="#" className="hover:text-yellow-300">Tuyển dụng</Link></li>
                        <li><Link to="#" className="hover:text-yellow-300">Liên hệ</Link></li>
                    </ul>
                </div>

                {/* Kết nối với chúng tôi */}
                <div>
                    <h3 className="font-bold text-lg mb-3">Kết nối với chúng tôi</h3>
                    <div className="flex space-x-3 mt-2">
                        <Link to="#" className="bg-white text-red-600 rounded-full p-2 hover:bg-yellow-300">
                            📘
                        </Link>
                        <Link to="#" className="bg-white text-red-600 rounded-full p-2 hover:bg-yellow-300">
                            📷
                        </Link>
                        <Link to="#" className="bg-white text-red-600 rounded-full p-2 hover:bg-yellow-300">
                            🐦
                        </Link>
                    </div>
                </div>

                {/* Liên hệ */}
                <div>
                    <h3 className="font-bold text-lg mb-3">Liên hệ</h3>
                    <p className="text-sm">Hotline: 1800 1234</p>
                    <p className="text-sm">Email: support@fptshop.com.vn</p>
                </div>
            </div>

            {/* Bản quyền */}
            <div className="mt-8 pt-6 border-t border-red-500 text-center text-sm">
                <p>© 2025 FPT Shop. Tất cả quyền được bảo lưu.</p>
            </div>
        </div>
    </footer>
);

export default FooterHome;
