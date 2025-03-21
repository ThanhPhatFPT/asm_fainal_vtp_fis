import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Tags, Package, Settings, Home, ShoppingCart } from 'lucide-react';

export default function Sidebar({ isOpen, toggleSidebar }) {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Tổng quan', path: '/admin' },
        { icon: Users, label: 'Người dùng', path: '/admin/users' },
        { icon: Tags, label: 'Danh mục', path: '/admin/categories' },
        { icon: Package, label: 'Sản phẩm', path: '/admin/products' },
        { icon: ShoppingCart, label: "Đơn hàng", path: "/admin/orders" },
        { icon: Settings, label: 'Quản lý quy trình', path: '/admin/taskList' },
    ];

    return (
        <div
            className={`w-64 bg-red-600 text-white h-screen fixed left-0 top-0 flex flex-col transition-transform duration-300 transform ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            {/* Logo */}
            <div className="p-4 flex justify-center mt-6">
                <img
                    src="https://cdn2.fptshop.com.vn/unsafe/150x0/filters:quality(100)/small/fptshop_logo_c5ac91ae46.png"
                    alt="FPT Shop Logo"
                    className="h-10 w-auto" // Điều chỉnh kích thước logo
                />
            </div>

            {/* Menu điều hướng */}
            <div className="p-4 flex-grow">
                <nav>
                    {menuItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 p-3 rounded-lg mb-2 transition-colors duration-200 ${
                                    isActive
                                        ? 'bg-red-700 text-yellow-300'
                                        : 'text-white hover:bg-red-700 hover:text-yellow-300'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Nút quay lại trang chủ */}
            <div className="p-4">
                <Link
                    to="/"
                    className="flex items-center space-x-3 p-3 rounded-lg bg-red-700 text-yellow-300 hover:bg-red-800 hover:text-white transition-colors duration-200"
                >
                    <Home size={20} />
                    <span>Quay lại trang chủ</span>
                </Link>
            </div>
        </div>
    );
}