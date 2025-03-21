import React, { useState, useEffect } from 'react';
import { Eye, X, ChevronLeft, ChevronRight, Check, Truck, Package, XCircle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OrderService from '../service/orderService.js';
import { motion } from 'framer-motion'; // Thêm framer-motion nếu muốn hiệu ứng

export default function Orders() {
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(''); // Default tab is "Tất cả"
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const itemsPerPage = 5;

    const orderStatuses = [
        { value: '', label: 'Tất cả' },
        { value: 'CHỜ_XÁC_NHẬN', label: 'Chờ xác nhận' },
        { value: 'CHỜ_LẤY_HÀNG', label: 'Chờ lấy hàng' },
        { value: 'CHỜ_GIAO_HÀNG', label: 'Chờ giao hàng' },
        { value: 'ĐÃ_GIAO', label: 'Đã giao' },
        { value: 'ĐÃ_HỦY', label: 'Đã hủy' }
    ];

    // Fetch all orders
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const data = await OrderService.getAllOrders();
                console.log('Fetched orders:', data);

                const formattedData = Array.isArray(data) ? data.map(order => ({
                    id: order.id || 'N/A',
                    orderDate: order.orderDate || order.createdAt || 'Unknown',
                    totalAmount: Number(order.totalAmount || order.amount || 0),
                    status: order.status || 'UNKNOWN',
                    paymentStatus: order.paymentStatus || 'UNKNOWN',
                    orderDetails: Array.isArray(order.orderDetails) ? order.orderDetails.map(detail => ({
                        id: detail.id || 'N/A',
                        quantity: detail.quantity || 1,
                        price: Number(detail.price || 0),
                        originalPrice: Number(detail.originalPrice || detail.price || 0),
                        discount: Number(detail.discount || 0),
                        product: {
                            id: detail.product?.id || 'N/A',
                            name: detail.product?.name || 'Unknown Product',
                            imageUrls: Array.isArray(detail.product?.imageUrls) ? detail.product.imageUrls : ['https://via.placeholder.com/100?text=Error']
                        }
                    })) : []
                })) : [];

                console.log('Formatted orders:', formattedData);
                setOrders(formattedData);
            } catch (err) {
                setError('Không thể tải danh sách đơn hàng: ' + (err.message || 'Lỗi không xác định'));
                toast.error('Lỗi khi tải đơn hàng: ' + (err.message || 'Vui lòng thử lại'));
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // Format currency in VND
    const formatPrice = (price) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

    // Format date and time
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === 'Unknown') return 'Không xác định';
        try {
            return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateStr));
        } catch {
            return 'Ngày không hợp lệ';
        }
    };

    // View order details
    const handleViewDetail = (order) => {
        console.log('Selected order:', order);
        setSelectedOrder(order);
        setShowDetailModal(true);
    };

    // Sort orders
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    // Handle order actions
    const handleOrderAction = async (orderId, action) => {
        try {
            switch (action) {
                case 'confirm':
                    await OrderService.setOrderToWaitingPickup(orderId);
                    toast.success(`Đơn hàng #${orderId} đã được xác nhận!`);
                    break;
                case 'ship':
                    await OrderService.setOrderToWaitingDelivery(orderId);
                    toast.success(`Đơn hàng #${orderId} đã được gửi đi!`);
                    break;
                case 'delivered':
                    await OrderService.setOrderToDelivered(orderId);
                    toast.success(`Đơn hàng #${orderId} đã giao thành công!`);
                    break;
                case 'cancel':
                    await OrderService.cancelOrderByAdmin(orderId);
                    toast.success(`Đơn hàng #${orderId} đã được hủy!`);
                    break;
                default:
                    throw new Error('Hành động không hợp lệ!');
            }
            // Làm mới danh sách đơn hàng
            const data = await OrderService.getAllOrders();
            const formattedData = Array.isArray(data) ? data.map(order => ({
                id: order.id || 'N/A',
                orderDate: order.orderDate || order.createdAt || 'Unknown',
                totalAmount: Number(order.totalAmount || order.amount || 0),
                status: order.status || 'UNKNOWN',
                paymentStatus: order.paymentStatus || 'UNKNOWN',
                orderDetails: Array.isArray(order.orderDetails) ? order.orderDetails.map(detail => ({
                    id: detail.id || 'N/A',
                    quantity: detail.quantity || 1,
                    price: Number(detail.price || 0),
                    originalPrice: Number(detail.originalPrice || detail.price || 0),
                    discount: Number(detail.discount || 0),
                    product: {
                        id: detail.product?.id || 'N/A',
                        name: detail.product?.name || 'Unknown Product',
                        imageUrls: Array.isArray(detail.product?.imageUrls) ? detail.product.imageUrls : ['https://via.placeholder.com/100?text=Error']
                    }
                })) : []
            })) : [];
            setOrders(formattedData);
        } catch (err) {
            toast.error('Lỗi khi xử lý đơn hàng: ' + (err.message || 'Vui lòng thử lại'));
        }
    };

    // Filter and sort orders
    const filteredOrders = orders
        .filter((order) => {
            const matchesStatus = activeTab ? order.status === activeTab : true;
            const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        })
        .sort((a, b) => {
            if (!sortField) return new Date(b.orderDate) - new Date(a.orderDate); // Default sort by latest date
            if (sortField === 'orderDate') {
                return sortDirection === 'asc'
                    ? new Date(a.orderDate) - new Date(b.orderDate)
                    : new Date(b.orderDate) - new Date(a.orderDate);
            }
            const aValue = a[sortField];
            const bValue = b[sortField];
            return sortDirection === 'asc'
                ? aValue > bValue ? 1 : -1
                : aValue < bValue ? 1 : -1;
        });

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) return <div className="text-center py-6">Đang tải đơn hàng...</div>;
    if (error) return <div className="text-center py-6 text-red-500">{error}</div>;

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Quản lý đơn hàng (Admin)</h3>

                {/* Tabs */}
                <div className="flex border-b mb-4">
                    {orderStatuses.map((status) => (
                        <button
                            key={status.value}
                            className={`px-4 py-2 text-sm font-medium ${
                                activeTab === status.value
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-blue-600'
                            }`}
                            onClick={() => {
                                setActiveTab(status.value);
                                setCurrentPage(1);
                            }}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã đơn hàng..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>

                {/* Orders table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                                onClick={() => handleSort('id')}
                            >
                                Mã đơn hàng {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                                onClick={() => handleSort('totalAmount')}
                            >
                                Tổng tiền {sortField === 'totalAmount' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                                onClick={() => handleSort('orderDate')}
                            >
                                Ngày đặt {sortField === 'orderDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Trạng thái
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Trạng thái thanh toán
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Thao tác
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedOrders.length > 0 ? (
                            paginatedOrders.map((order) => (
                                <tr key={order.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {order.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {formatPrice(order.totalAmount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {formatDate(order.orderDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                order.status === 'CHỜ_XÁC_NHẬN'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : order.status === 'CHỜ_LẤY_HÀNG'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : order.status === 'CHỜ_GIAO_HÀNG'
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : order.status === 'ĐÃ_GIAO'
                                                                ? 'bg-green-100 text-green-800'
                                                                : order.status === 'ĐÃ_HỦY'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {order.status.replace('_', ' ') || 'Không xác định'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                order.paymentStatus === 'ĐÃ_THANH_TOÁN'
                                                    ? 'bg-green-100 text-green-800'
                                                    : order.paymentStatus === 'THANH_TOÁN_MỘT_PHẦN'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : order.paymentStatus === 'CHƯA_THANH_TOÁN'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {order.paymentStatus.replace('_', ' ') || 'Không xác định'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                                        <button
                                            onClick={() => handleViewDetail(order)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {order.status === 'CHỜ_XÁC_NHẬN' && (
                                            <>
                                                <button
                                                    onClick={() => handleOrderAction(order.id, 'cancel')}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Hủy"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleOrderAction(order.id, 'confirm')}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Xác nhận"
                                                >
                                                    <Check size={18} />
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'CHỜ_LẤY_HÀNG' && (
                                            <>
                                                <button
                                                    onClick={() => handleOrderAction(order.id, 'cancel')}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Hủy"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleOrderAction(order.id, 'ship')}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Gửi hàng"
                                                >
                                                    <Truck size={18} />
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'CHỜ_GIAO_HÀNG' && (
                                            <>
                                                <button
                                                    onClick={() => handleOrderAction(order.id, 'cancel')}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Không nhận hàng"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleOrderAction(order.id, 'delivered')}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Đã giao"
                                                >
                                                    <Package size={18} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center py-4 text-gray-500">
                                    Không có đơn hàng nào phù hợp
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredOrders.length > itemsPerPage && (
                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 text-gray-600 disabled:text-gray-300 hover:text-blue-600"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm text-gray-700">
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 text-gray-600 disabled:text-gray-300 hover:text-blue-600"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Order details modal */}
            {showDetailModal && selectedOrder && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-xl">
                        <div className="flex justify-between mb-4 border-b pb-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                Chi tiết đơn hàng #{selectedOrder.id}
                            </h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <p className="text-base">
                                    <strong className="text-gray-700">Ngày đặt:</strong>{' '}
                                    {formatDate(selectedOrder.orderDate)}
                                </p>
                                <p className="text-base">
                                    <strong className="text-gray-700">Tổng tiền:</strong>{' '}
                                    <span className="text-red-600 font-semibold">
                                        {formatPrice(selectedOrder.totalAmount)}
                                    </span>
                                </p>
                                <p className="text-base">
                                    <strong className="text-gray-700">Trạng thái:</strong>{' '}
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            selectedOrder.status === 'CHỜ_XÁC_NHẬN'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : selectedOrder.status === 'CHỜ_LẤY_HÀNG'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : selectedOrder.status === 'CHỜ_GIAO_HÀNG'
                                                        ? 'bg-orange-100 text-orange-800'
                                                        : selectedOrder.status === 'ĐÃ_GIAO'
                                                            ? 'bg-green-100 text-green-800'
                                                            : selectedOrder.status === 'ĐÃ_HỦY'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {selectedOrder.status.replace('_', ' ') || 'Không xác định'}
                                    </span>
                                </p>
                                <p className="text-base">
                                    <strong className="text-gray-700">Trạng thái thanh toán:</strong>{' '}
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            selectedOrder.paymentStatus === 'ĐÃ_THANH_TOÁN'
                                                ? 'bg-green-100 text-green-800'
                                                : selectedOrder.paymentStatus === 'THANH_TOÁN_MỘT_PHẦN'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : selectedOrder.paymentStatus === 'CHƯA_THANH_TOÁN'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {selectedOrder.paymentStatus.replace('_', ' ') || 'Không xác định'}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Sản phẩm đã đặt</h3>
                                {selectedOrder.orderDetails && selectedOrder.orderDetails.length > 0 ? (
                                    <ul className="space-y-4 max-h-96 overflow-y-auto">
                                        {selectedOrder.orderDetails.map((detail, index) => (
                                            <li
                                                key={index}
                                                className="border p-4 rounded-lg flex items-start space-x-4 bg-gray-50 hover:bg-gray-100 transition"
                                            >
                                                <img
                                                    src={
                                                        detail.product.imageUrls && detail.product.imageUrls[0]
                                                            ? detail.product.imageUrls[0]
                                                            : 'https://via.placeholder.com/100?text=Error'
                                                    }
                                                    alt={detail.product.name}
                                                    className="w-20 h-20 object-cover rounded-md shadow-sm"
                                                    onError={(e) =>
                                                        (e.currentTarget.src = 'https://via.placeholder.com/100?text=Error')
                                                    }
                                                />
                                                <div className="flex-1">
                                                    <p className="text-base font-medium text-gray-900">
                                                        {detail.product.name}
                                                    </p>
                                                    <p className="text-sm text-gray-700">
                                                        <strong>Số lượng:</strong> {detail.quantity}
                                                    </p>
                                                    <p className="text-sm text-gray-700">
                                                        <strong>Giá:</strong>{' '}
                                                        <span className="text-red-600 font-medium">
                                                            {formatPrice(detail.price)}
                                                        </span>{' '}
                                                        {detail.discount > 0 && (
                                                            <span className="text-gray-500 line-through">
                                                                {formatPrice(detail.originalPrice)}
                                                            </span>
                                                        )}
                                                    </p>
                                                    {detail.discount > 0 && (
                                                        <p className="text-sm text-green-600">
                                                            <strong>Giảm giá:</strong> {detail.discount}%
                                                        </p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500">Không có sản phẩm nào trong đơn hàng này.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}