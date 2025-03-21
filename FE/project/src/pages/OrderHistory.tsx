import React, { useState, useEffect } from 'react';
import { Eye, X, ChevronLeft, ChevronRight, Trash2, CheckCircle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import orderService from '../service/orderService.js';

export default function OrderHistory() {
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(''); // Default tab: "Tất cả"
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
        { value: 'ĐÃ_HỦY', label: 'Đã hủy' },
    ];

    // Lấy userId từ token
    const getUserIdFromToken = () => {
        const token = Cookies.get('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để xem lịch sử đơn hàng');
        }
        try {
            const decoded = jwtDecode(token);
            return decoded.userId || decoded.sub || decoded.id;
        } catch (err) {
            throw new Error('Token không hợp lệ: ' + err.message);
        }
    };

    // Gọi API để lấy tất cả đơn hàng
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const userId = getUserIdFromToken();
            const response = await fetch(`http://localhost:8080/api/orders/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${Cookies.get('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Không thể lấy danh sách đơn hàng: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();

            const formattedData = Array.isArray(data) ? data.map(order => ({
                id: order.id || 'N/A',
                orderDate: order.orderDate || order.createdAt || 'Unknown',
                totalAmount: Number(order.totalAmount || order.amount || 0),
                status: order.status || 'UNKNOWN',
                paymentStatus: order.paymentStatus || 'UNKNOWN',
                isConfirmedByUser: order.isConfirmedByUser || false,
                orderDetails: Array.isArray(order.orderDetails) ? order.orderDetails.map(detail => ({
                    id: detail.id || 'N/A',
                    quantity: detail.quantity || 1,
                    price: Number(detail.price || 0),
                    originalPrice: Number(detail.originalPrice || detail.price || 0),
                    discount: Number(detail.discount || 0),
                    product: {
                        id: detail.product?.id || 'N/A',
                        name: detail.product?.name || 'Unknown Product',
                        imageUrls: Array.isArray(detail.product?.imageUrls) ? detail.product.imageUrls : ['https://via.placeholder.com/100?text=Error'],
                    },
                })) : [],
            })) : [];

            setOrders(formattedData);
        } catch (err) {
            setError('Không tìm thấy đơn hàng: ' + (err.message || 'Lỗi không xác định'));
            toast.error('Lỗi khi tải đơn hàng: ' + (err.message || 'Vui lòng thử lại'));
        } finally {
            setLoading(false);
        }
    };

    // Hàm hiển thị toast xác nhận hủy đơn hàng
    const confirmCancelOrder = (orderId) => {
        const toastId = toast(
            <div>
                <p>Bạn có chắc chắn muốn hủy đơn hàng #{orderId} không?</p>
                <div className="flex justify-end space-x-2 mt-2">
                    <button
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={async () => {
                            toast.dismiss(toastId);
                            try {
                                const response = await orderService.cancelOrderByUser(orderId);
                                toast.success(response.message || 'Hủy đơn hàng thành công!');
                                fetchOrders();
                            } catch (error) {
                                toast.error(error.message || 'Lỗi khi hủy đơn hàng, vui lòng thử lại.');
                            }
                        }}
                    >
                        Xác nhận
                    </button>
                    <button
                        className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                        onClick={() => toast.dismiss(toastId)}
                    >
                        Hủy
                    </button>
                </div>
            </div>,
            {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                closeButton: false,
                draggable: false,
            }
        );
    };

    // Hàm hiển thị toast xác nhận đã nhận hàng
    const confirmOrderReceived = (orderId) => {
        const toastId = toast(
            <div>
                <p>Bạn có chắc chắn muốn xác nhận đã nhận đơn hàng #{orderId} không?</p>
                <div className="flex justify-end space-x-2 mt-2">
                    <button
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        onClick={async () => {
                            toast.dismiss(toastId);
                            try {
                                const response = await orderService.confirmOrderDelivered(orderId);
                                toast.success(response.message || 'Xác nhận nhận hàng thành công!');
                                setOrders(prevOrders =>
                                    prevOrders.map(order =>
                                        order.id === orderId
                                            ? { ...order, isConfirmedByUser: true }
                                            : order
                                    )
                                );
                                fetchOrders();
                            } catch (error) {
                                toast.error(error.message || 'Lỗi khi xác nhận nhận hàng, vui lòng thử lại.');
                            }
                        }}
                    >
                        Xác nhận
                    </button>
                    <button
                        className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                        onClick={() => toast.dismiss(toastId)}
                    >
                        Hủy
                    </button>
                </div>
            </div>,
            {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                closeButton: false,
                draggable: false,
            }
        );
    };

    // Gọi API lần đầu khi component mount
    useEffect(() => {
        fetchOrders();
    }, []); // Không có polling nữa

    // Format currency và date
    const formatPrice = (price) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === 'Unknown') return 'Không xác định';
        try {
            return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateStr));
        } catch {
            return 'Ngày không hợp lệ';
        }
    };

    // Xem chi tiết đơn hàng
    const handleViewDetail = (order) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
    };

    // Lọc và sắp xếp cục bộ
    const filteredOrders = orders
        .filter((order) => {
            const matchesStatus = activeTab ? order.status === activeTab : true;
            const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        })
        .sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));

    // Phân trang cục bộ
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
            <div className="bg-white rounded-lg shadow-sm p-6 max-w-5xl mx-auto mt-10">
                <h3 className="text-2xl font-semibold mb-6 text-gray-800">Lịch sử đơn hàng</h3>

                {/* Tabs */}
                <div className="flex border-b mb-4">
                    {orderStatuses.map((status) => (
                        <button
                            key={status.value}
                            className={`px-4 py-2 text-sm font-medium ${
                                activeTab === status.value
                                    ? 'border-b-2 border-blue-500 text-blue-500'
                                    : 'text-gray-600 hover:text-blue-500'
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
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã đơn hàng..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Orders table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Mã đơn hàng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Ngày đặt</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Tổng tiền</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedOrders.length > 0 ? (
                            paginatedOrders.map((order) => (
                                <tr key={order.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {order.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatDate(order.orderDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatPrice(order.totalAmount)}
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                                        <button
                                            onClick={() => handleViewDetail(order)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {order.status === 'CHỜ_XÁC_NHẬN' && (
                                            <button
                                                onClick={() => confirmCancelOrder(order.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        {order.status === 'ĐÃ_GIAO' && !order.isConfirmedByUser && (
                                            <button
                                                onClick={() => confirmOrderReceived(order.id)}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-4 text-gray-500">
                                    Không có đơn hàng nào phù hợp
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredOrders.length > itemsPerPage && (
                    <div className="flex justify-between items-center mt-6">
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