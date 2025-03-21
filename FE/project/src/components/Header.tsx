import React from 'react';
import { Bell, Menu, Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Header({ isSidebarOpen, toggleSidebar }) {
    const { userEmail, handleLogout } = useAuth();
    const navigate = useNavigate();

    const onLogout = () => {
        toast(
            <div>
                <p>Bạn có chắc chắn muốn đăng xuất không?</p>
                <div className="flex space-x-4 mt-2">
                    <button
                        onClick={() => {
                            handleLogout();
                            navigate('/login');
                            toast.dismiss();
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Có
                    </button>
                    <button
                        onClick={() => toast.dismiss()}
                        className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                    >
                        Không
                    </button>
                </div>
            </div>,
            {
                position: 'top-center',
                autoClose: false,
                closeButton: false,
                draggable: false,
            }
        );
    };

    return (
        <header
            className={`h-16 bg-white shadow-sm fixed top-0 right-0 z-10 transition-all duration-300 ${
                isSidebarOpen ? 'left-64' : 'left-0'
            }`}
        >
            <div className="flex items-center justify-between h-full px-6">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={toggleSidebar}
                        className="p-1 hover:bg-gray-100 rounded-lg"
                        title={isSidebarOpen ? 'Ẩn Sidebar' : 'Hiện Sidebar'}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="relative p-2 hover:bg-gray-100 rounded-full">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    <div className="flex items-center space-x-2">
                        <img
                            className="h-8 w-8 rounded-full"
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail || 'Admin')}`}
                            alt="Profile"
                        />
                        <span className="font-medium">{userEmail || 'Quản trị viên'}</span>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-red-600 transition-colors"
                        title="Đăng xuất"
                    >
                        <LogOut size={20} />
                        <span className="text-sm font-medium">Đăng xuất</span>
                    </button>
                </div>
            </div>
        </header>
    );
}