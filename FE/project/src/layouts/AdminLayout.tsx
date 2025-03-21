import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev); // Đảo ngược trạng thái
        console.log('Sidebar toggled:', !isSidebarOpen); // Debug để kiểm tra
    };

    return (
        <div className="bg-gray-50 min-h-screen flex">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Nội dung chính */}
            <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                <main className="pt-16">
                    <div className="p-6 space-y-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}