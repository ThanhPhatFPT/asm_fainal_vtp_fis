import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, UserCheck, TrendingUp, ShoppingCart, X, Search, ArrowUpDown } from 'lucide-react';
import orderService from '../service/orderService.js';

function RevenueStats({ onOrdersClick }) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    uniqueUserCount: 0, // Thêm state cho tổng khách hàng
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [revenue, orders, avgValue, uniqueUsers] = await Promise.all([
        orderService.getTotalRevenue(),
        orderService.getTotalOrders(),
        orderService.getAverageOrderValue(),
        orderService.getUniqueUserCount(), // Gọi API để lấy tổng số khách hàng
      ]);
      setStats({
        totalRevenue: revenue,
        totalOrders: orders,
        averageOrderValue: avgValue,
        uniqueUserCount: uniqueUsers,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <div>Loading stats...</div>;

  const formattedStats = [
    { icon: DollarSign, label: 'Tổng doanh thu', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue), trend: '+12.5%' },
    { icon: ShoppingBag, label: 'Tổng đơn hàng', value: stats.totalOrders.toLocaleString('vi-VN'), trend: '+8.3%', onClick: onOrdersClick },
    { icon: UserCheck, label: 'Tổng khách hàng', value: stats.uniqueUserCount.toLocaleString('vi-VN'), trend: '+5.7%' }, // Sử dụng dữ liệu từ API
    { icon: TrendingUp, label: 'Giá trị đơn TB', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.averageOrderValue), trend: '+2.1%' },
  ];

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {formattedStats.map((stat, index) => (
            <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100"
                onClick={stat.onClick || null}
            >
              <div className="flex items-center justify-between">
                <div className="bg-blue-100 p-3 rounded-full">
                  <stat.icon size={24} className="text-blue-600" />
                </div>
                <span className="text-green-500 text-sm font-medium">{stat.trend}</span>
              </div>
              <p className="mt-4 text-2xl font-semibold">{stat.value}</p>
              <p className="text-gray-600 text-sm">{stat.label}</p>
            </div>
        ))}
      </div>
  );
}

export default function Dashboard() {
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const ordersPerPage = 5;

  const fetchRecentOrders = async () => {
    try {
      const orders = await orderService.getAllOrders();
      const sortedOrders = orders
          .filter((order) => order.status === 'ĐÃ_GIAO')
          .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
          .slice(0, 5);
      setRecentOrders(sortedOrders);
      setAllOrders(orders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const orderDetails = await orderService.getOrderById(orderId);
      setSelectedOrder(orderDetails);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const handleOrderClick = (orderId) => {
    fetchOrderDetails(orderId);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  const handleOrdersClick = () => {
    setShowOrdersModal(true);
    setCurrentPage(1);
    setSearchTerm('');
    setSortOrder('desc');
  };

  const closeOrdersModal = () => {
    setShowOrdersModal(false);
  };

  const filteredOrders = allOrders
      .filter((order) => order.id.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const dateA = new Date(a.orderDate);
        const dateB = new Date(b.orderDate);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
      <>
        <h2 className="text-2xl font-semibold mb-6">Tổng quan doanh thu</h2>
        <RevenueStats onOrdersClick={handleOrdersClick} />
        <div className="mt-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Đơn hàng gần đây (Đã giao)</h3>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                      <div
                          key={order.id}
                          onClick={() => handleOrderClick(order.id)}
                          className="flex items-center justify-between py-3 border-b last:border-0 cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <ShoppingCart size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Đơn hàng #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.orderDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                              -{' '}
                              {new Date(order.orderDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                          </p>
                          <p className="text-sm text-green-500">{order.status}</p>
                        </div>
                      </div>
                  ))
              ) : (
                  <p className="text-gray-500">Chưa có đơn hàng nào đã giao.</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal chi tiết đơn hàng */}
        {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
              <div className="bg-white p-8 rounded-xl shadow-2xl w-3/5 max-h-[85vh] overflow-y-auto transform transition-all duration-300 scale-95 hover:scale-100">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h3 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng #{selectedOrder.id.slice(0, 8)}</h3>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                    <X size={28} />
                  </button>
                </div>
                <div className="space-y-4 text-gray-700">
                  <div className="flex justify-between">
                    <span className="font-semibold">Ngày đặt hàng:</span>
                    <span>{new Date(selectedOrder.orderDate).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Tổng tiền:</span>
                    <span className="font-medium text-blue-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Trạng thái:</span>
                    <span className="font-medium text-green-600">{selectedOrder.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Trạng thái thanh toán:</span>
                    <span className={`font-medium ${selectedOrder.paymentStatus === 'ĐÃ_THANH_TOÁN' ? 'text-green-600' : 'text-gray-500'}`}>{selectedOrder.paymentStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">ID người dùng:</span>
                    <span className="text-gray-600">{selectedOrder.userId}</span>
                  </div>
                </div>
                {selectedOrder.orderDetails && selectedOrder.orderDetails.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Danh sách sản phẩm</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-gray-50 rounded-lg shadow-sm">
                          <thead>
                          <tr className="bg-blue-100 text-blue-800 text-sm uppercase font-semibold">
                            <th className="py-3 px-4 text-left">Tên sản phẩm</th>
                            <th className="py-3 px-4 text-center">Số lượng</th>
                            <th className="py-3 px-4 text-center">Giảm giá</th>
                            <th className="py-3 px-4 text-right">Giá gốc</th>
                            <th className="py-3 px-4 text-right">Giá sau giảm</th>
                            <th className="py-3 px-4 text-center">Hình ảnh</th>
                          </tr>
                          </thead>
                          <tbody>
                          {selectedOrder.orderDetails.map((detail) => {
                            const discountedPrice = detail.originalPrice * (1 - detail.discount / 100);
                            return (
                                <tr key={detail.id} className="border-b last:border-0 hover:bg-gray-100 transition-colors duration-200">
                                  <td className="py-3 px-4 text-gray-700">{detail.product.name}</td>
                                  <td className="py-3 px-4 text-center text-gray-600">{detail.quantity}</td>
                                  <td className="py-3 px-4 text-center text-red-500">{detail.discount}%</td>
                                  <td className="py-3 px-4 text-right text-gray-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detail.originalPrice)}</td>
                                  <td className="py-3 px-4 text-right text-green-600 font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountedPrice)}</td>
                                  <td className="py-3 px-4 text-center">
                                    {detail.product.imageUrls && detail.product.imageUrls.length > 0 ? (
                                        <img src={detail.product.imageUrls[0]} alt={detail.product.name} className="w-12 h-12 object-cover rounded-full border border-gray-200" />
                                    ) : (
                                        <span className="text-gray-400">Không có ảnh</span>
                                    )}
                                  </td>
                                </tr>
                            );
                          })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                )}
              </div>
            </div>
        )}

        {/* Modal tất cả đơn hàng */}
        {showOrdersModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
              <div className="bg-white p-8 rounded-xl shadow-2xl w-4/5 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h3 className="text-2xl font-bold text-gray-800">Tất cả đơn hàng</h3>
                  <button onClick={closeOrdersModal} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                    <X size={28} />
                  </button>
                </div>
                <div className="mb-4 flex items-center">
                  <Search size={20} className="text-gray-500 mr-2" />
                  <input
                      type="text"
                      placeholder="Tìm kiếm theo ID đơn hàng..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-50 rounded-lg shadow-sm">
                    <thead>
                    <tr className="bg-blue-100 text-blue-800 text-sm uppercase font-semibold">
                      <th className="py-3 px-4 text-left">ID đơn hàng</th>
                      <th className="py-3 px-4 text-left">
                        Ngày đặt hàng
                        <button onClick={toggleSortOrder} className="ml-2 focus:outline-none">
                          <ArrowUpDown size={16} />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">Tổng tiền</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentOrders.length > 0 ? (
                        currentOrders.map((order) => (
                            <tr key={order.id} className="border-b last:border-0 hover:bg-gray-100 transition-colors duration-200">
                              <td className="py-3 px-4 text-gray-700">{order.id.slice(0, 8)}</td>
                              <td className="py-3 px-4 text-gray-700">{new Date(order.orderDate).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                              <td className="py-3 px-4 text-right text-gray-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`font-medium ${order.status === 'ĐÃ_GIAO' ? 'text-green-600' : 'text-gray-500'}`}>{order.status}</span>
                              </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                          <td colSpan="4" className="py-3 px-4 text-center text-gray-500">Không tìm thấy đơn hàng nào.</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-gray-600">
                    Hiển thị {indexOfFirstOrder + 1} - {Math.min(indexOfLastOrder, filteredOrders.length)} trong tổng số {filteredOrders.length} đơn hàng
                  </div>
                  <div className="flex space-x-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                    >
                      Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 rounded-lg ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                        >
                          {page}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </>
  );
}