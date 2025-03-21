import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import OrderService from '../service/orderService.js'; // Adjust the import path based on your file structure

// Adjusted BPMN structure with smaller, compact layout
const bpmnStructure = {
    nodes: [
        { id: 'StartEvent_1', type: 'start', x: 50, y: 100, label: 'Bắt đầu' },
        { id: 'Activity_1q497ee', type: 'task', x: 150, y: 100, label: 'Xác nhận đơn hàng' },
        { id: 'Gateway_1r9z8bm', type: 'gateway', x: 250, y: 100, label: 'Kiểm tra' },
        { id: 'Activity_1q497eh', type: 'task', x: 350, y: 60, label: 'Chuẩn bị hàng' },
        { id: 'Gateway_1jhq03c', type: 'gateway', x: 450, y: 60, label: 'Kiểm tra' },
        { id: 'Activity_1ti5j3l', type: 'task', x: 550, y: 60, label: 'Chờ giao hàng' },
        { id: 'Gateway_1rs5tb5', type: 'gateway', x: 650, y: 60, label: 'Kiểm tra' },
        { id: 'Activity_1noutv2', type: 'task', x: 750, y: 60, label: 'Giao hàng thành công' },
        { id: 'EndEvent_0p6zzv0', type: 'end', x: 850, y: 60, label: 'Kết thúc' },
        { id: 'Activity_00kxg4m', type: 'task', x: 250, y: 160, label: 'Hủy đơn hàng' },
        { id: 'Event_1nkvduy', type: 'end', x: 350, y: 160, label: 'Kết thúc' },
        { id: 'Activity_10ex0t7', type: 'task', x: 450, y: 160, label: 'Hủy đơn hàng' },
        { id: 'EndEvent_0x6ir2l', type: 'end', x: 550, y: 160, label: 'Kết thúc' },
        { id: 'Activity_11bgzqx', type: 'task', x: 650, y: 160, label: 'Không nhận hàng' },
        { id: 'Event_0kahwfd', type: 'end', x: 750, y: 160, label: 'Kết thúc' },
    ],
    edges: [
        { from: 'StartEvent_1', to: 'Activity_1q497ee' },
        { from: 'Activity_1q497ee', to: 'Gateway_1r9z8bm' },
        { from: 'Gateway_1r9z8bm', to: 'Activity_1q497eh', condition: 'Có' },
        { from: 'Gateway_1r9z8bm', to: 'Activity_00kxg4m', condition: 'Không' },
        { from: 'Activity_1q497eh', to: 'Gateway_1jhq03c' },
        { from: 'Gateway_1jhq03c', to: 'Activity_1ti5j3l', condition: 'Có' },
        { from: 'Gateway_1jhq03c', to: 'Activity_10ex0t7', condition: 'Không' },
        { from: 'Activity_1ti5j3l', to: 'Gateway_1rs5tb5' },
        { from: 'Gateway_1rs5tb5', to: 'Activity_1noutv2', condition: 'Có' },
        { from: 'Gateway_1rs5tb5', to: 'Activity_11bgzqx', condition: 'Không' },
        { from: 'Activity_00kxg4m', to: 'Event_1nkvduy' },
        { from: 'Activity_10ex0t7', to: 'EndEvent_0x6ir2l' },
        { from: 'Activity_1noutv2', to: 'EndEvent_0p6zzv0' },
        { from: 'Activity_11bgzqx', to: 'Event_0kahwfd' },
    ],
};

const TaskList = () => {
    const processDefinitionId = "asm_fainal_be-process:1:7e88e1c2-03e1-11f0-8783-d8bbc178c95e";
    const [runtimeData, setRuntimeData] = useState({});
    const [tasks, setTasks] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [columnState, setColumnState] = useState({});
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskDetails, setTaskDetails] = useState(null);

    const taskNames = {
        'Activity_1q497ee': 'Xác nhận đơn hàng',
        'Activity_1q497eh': 'Chuẩn bị hàng',
        'Activity_1ti5j3l': 'Chờ giao hàng',
        'Activity_1noutv2': 'Giao hàng thành công',
        'Activity_00kxg4m': 'Hủy đơn hàng',
        'Activity_10ex0t7': 'Hủy đơn hàng',
        'Activity_11bgzqx': 'Không nhận hàng'
    };

    const initialColumns = {
        'Activity_1q497ee': { name: 'Xác nhận đơn hàng', items: [] },
        'Activity_1q497eh': { name: 'Chuẩn bị hàng', items: [] },
        'Activity_1ti5j3l': { name: 'Chờ giao hàng', items: [] },
        'Activity_1noutv2': { name: 'Giao hàng thành công', items: [] },
        'Activity_00kxg4m': { name: 'Hủy đơn hàng', items: [] },
        'Activity_10ex0t7': { name: 'Hủy đơn hàng', items: [] },
        'Activity_11bgzqx': { name: 'Không nhận hàng', items: [] },
    };

    const fetchRuntimeData = async () => {
        try {
            setLoading(true);
            const instancesResponse = await fetch(
                `/engine-rest/process-instance?processDefinitionId=${processDefinitionId}`
            );
            if (!instancesResponse.ok) {
                throw new Error("Không thể lấy process instances");
            }
            const instances = await instancesResponse.json();

            const counts = {};
            const newTasks = {};
            for (const instance of instances) {
                const [activityResponse, variablesResponse] = await Promise.all([
                    fetch(`/engine-rest/process-instance/${instance.id}/activity-instances`),
                    fetch(`/engine-rest/process-instance/${instance.id}/variables`)
                ]);

                if (!activityResponse.ok) {
                    throw new Error("Không thể lấy activity instances");
                }
                const activityData = await activityResponse.json();

                let orderId = instance.id;
                if (variablesResponse.ok) {
                    const variables = await variablesResponse.json();
                    orderId = variables.orderId?.value || variables.businessKey || instance.id;
                }

                activityData.childActivityInstances?.forEach((activity) => {
                    if (!activity.endTime) {
                        const activityId = activity.activityId;
                        counts[activityId] = (counts[activityId] || 0) + 1;
                        const taskKey = `${activityId}_${orderId}`;
                        newTasks[taskKey] = { id: orderId, activityId };
                    }
                });
            }
            setRuntimeData(counts);
            setTasks(newTasks);
        } catch (err) {
            setError(`Lỗi khi lấy dữ liệu runtime: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchTaskDetails = async (orderId) => {
        try {
            const details = await OrderService.getOrderById(orderId);
            setTaskDetails(details);
        } catch (error) {
            console.error('Error fetching order details:', error.response?.data || error.message);
            setError('Không thể lấy chi tiết đơn hàng');
        }
    };

    useEffect(() => {
        const newColumns = { ...initialColumns };
        Object.values(tasks).forEach(({ activityId, id: orderId }) => {
            if (newColumns[activityId]) {
                const taskKey = `${activityId}_${orderId}`;
                newColumns[activityId].items.push({ id: taskKey, orderId, activityId });
            }
        });
        setColumnState(newColumns);
    }, [tasks]);

    useEffect(() => {
        fetchRuntimeData();
    }, []);

    const onDragEnd = async (result) => {
        const { source, destination } = result;
        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return;
        }

        const newColumns = { ...columnState };
        const sourceColumn = { ...newColumns[source.droppableId] };
        const destColumn = { ...newColumns[destination.droppableId] };
        const draggedItem = sourceColumn.items[source.index];

        sourceColumn.items = [...sourceColumn.items];
        destColumn.items = [...destColumn.items];
        sourceColumn.items.splice(source.index, 1);
        destColumn.items.splice(destination.index, 0, draggedItem);
        newColumns[source.droppableId] = sourceColumn;
        newColumns[destination.droppableId] = destColumn;
        setColumnState(newColumns);

        const orderId = draggedItem.orderId;
        try {
            let result;
            switch (destination.droppableId) {
                case 'Activity_1q497eh':
                    result = await OrderService.setOrderToWaitingPickup(orderId);
                    break;
                case 'Activity_1ti5j3l':
                    result = await OrderService.setOrderToWaitingDelivery(orderId);
                    break;
                case 'Activity_1noutv2':
                    result = await OrderService.setOrderToDelivered(orderId);
                    break;
                case 'Activity_00kxg4m':
                case 'Activity_10ex0t7':
                case 'Activity_11bgzqx':
                    result = await OrderService.cancelOrderByAdmin(orderId);
                    break;
                default:
                    return;
            }

            if (!result) {
                throw new Error('API update failed');
            }
            console.log(`Order ${orderId} updated to ${destColumn.name}`);
            await fetchRuntimeData();
        } catch (error) {
            console.error('Error updating order status:', error);
            setColumnState(columnState);
        }
    };

    const handleTaskClick = (item) => {
        setSelectedTask(item);
        fetchTaskDetails(item.orderId);
    };

    const closeModal = () => {
        setSelectedTask(null);
        setTaskDetails(null);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="container mx-auto p-6 max-w-8xl bg-gray-50 min-h-screen">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 pb-4 border-b-4 border-indigo-500 tracking-tight">
                Process Monitor - Quản Lý Đơn Hàng
            </h1>

            {loading && (
                <p className="text-indigo-600 text-lg mb-6 animate-pulse">
                    <svg className="inline w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                    </svg>
                    Đang tải dữ liệu...
                </p>
            )}
            {error && (
                <p className="text-red-600 text-lg mb-6 bg-red-100 p-3 rounded-lg shadow">
                    <svg className="inline w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Lỗi: {error}
                </p>
            )}

            {/* Compact BPMN Diagram */}
            <div className="mb-12 bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sơ Đồ Quy Trình</h2>
                <div className="overflow-x-auto">
                    <svg width="900" height="250" className="w-full">
                        {/* Nodes */}
                        {bpmnStructure.nodes.map((node) => {
                            let shape, labelBg;
                            if (node.type === 'start') {
                                shape = (
                                    <circle
                                        cx={node.x}
                                        cy={node.y}
                                        r="20"
                                        fill="url(#startGradient)"
                                        stroke="#2ecc71"
                                        strokeWidth="2"
                                        className="transition-transform duration-300 hover:scale-110"
                                    />
                                );
                                labelBg = (
                                    <rect x={node.x - 30} y={node.y + 25} width="60" height="18" rx="4" fill="#2ecc71" opacity="0.8" />
                                );
                            } else if (node.type === 'end') {
                                shape = (
                                    <circle
                                        cx={node.x}
                                        cy={node.y}
                                        r="20"
                                        fill="url(#endGradient)"
                                        stroke="#e74c3c"
                                        strokeWidth="2"
                                        className="transition-transform duration-300 hover:scale-110"
                                    />
                                );
                                labelBg = (
                                    <rect x={node.x - 30} y={node.y + 25} width="60" height="18" rx="4" fill="#e74c3c" opacity="0.8" />
                                );
                            } else if (node.type === 'gateway') {
                                shape = (
                                    <polygon
                                        points={`${node.x - 20},${node.y} ${node.x},${node.y - 20} ${node.x + 20},${node.y} ${node.x},${node.y + 20}`}
                                        fill="#ecf0f1"
                                        stroke="#3498db"
                                        strokeWidth="2"
                                        className="transition-transform duration-300 hover:scale-110"
                                    />
                                );
                                labelBg = (
                                    <rect x={node.x - 30} y={node.y + 25} width="60" height="18" rx="4" fill="#3498db" opacity="0.8" />
                                );
                            } else if (node.type === 'task') {
                                shape = (
                                    <rect
                                        x={node.x - 60}
                                        y={node.y - 25}
                                        width="120"
                                        height="50"
                                        rx="10"
                                        fill={runtimeData[node.id] ? 'url(#taskGradient)' : '#bdc3c7'}
                                        stroke="#2980b9"
                                        strokeWidth="2"
                                        className="transition-transform duration-300 hover:scale-105"
                                    />
                                );
                                labelBg = (
                                    <rect x={node.x - 60} y={node.y + 30} width="120" height="20" rx="4" fill="#2980b9" opacity="0.8" />
                                );
                            }
                            return (
                                <g key={node.id}>
                                    {shape}
                                    <text
                                        x={node.x}
                                        y={node.y}
                                        textAnchor="middle"
                                        fontSize="14"
                                        fill="#fff"
                                        dy=".35em"
                                        className="font-semibold"
                                    >
                                        {node.label}
                                    </text>
                                    {labelBg}
                                    {node.type === 'task' && (
                                        <text
                                            x={node.x}
                                            y={node.y + 40}
                                            textAnchor="middle"
                                            fontSize="12"
                                            fill="#fff"
                                            className="font-bold"
                                        >
                                            {runtimeData[node.id] || 0} đơn
                                        </text>
                                    )}
                                    <text
                                        x={node.x}
                                        y={node.y + 35}
                                        textAnchor="middle"
                                        fontSize="12"
                                        fill="#fff"
                                        className="font-semibold"
                                    >
                                        {node.type !== 'task' ? node.label : ''}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Edges */}
                        {bpmnStructure.edges.map((edge) => {
                            const fromNode = bpmnStructure.nodes.find((n) => n.id === edge.from);
                            const toNode = bpmnStructure.nodes.find((n) => n.id === edge.to);
                            if (fromNode && toNode) {
                                const midX = (fromNode.x + toNode.x) / 2;
                                const midY = (fromNode.y + toNode.y) / 2;
                                return (
                                    <g key={`${edge.from}-${edge.to}`}>
                                        <line
                                            x1={fromNode.x}
                                            y1={fromNode.y}
                                            x2={toNode.x}
                                            y2={toNode.y}
                                            stroke="#7f8c8d"
                                            strokeWidth="2"
                                            markerEnd="url(#arrowhead)"
                                            className="transition-opacity duration-300 hover:opacity-70"
                                        />
                                        {edge.condition && (
                                            <>
                                                <rect
                                                    x={midX - 20}
                                                    y={midY - 8}
                                                    width="40"
                                                    height="16"
                                                    rx="4"
                                                    fill="#34495e"
                                                    opacity="0.9"
                                                />
                                                <text
                                                    x={midX}
                                                    y={midY + 4}
                                                    textAnchor="middle"
                                                    fontSize="10"
                                                    fill="#fff"
                                                    className="font-medium"
                                                >
                                                    {edge.condition}
                                                </text>
                                            </>
                                        )}
                                    </g>
                                );
                            }
                            return null;
                        })}

                        {/* Definitions */}
                        <defs>
                            <linearGradient id="startGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#2ecc71', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#27ae60', stopOpacity: 1 }} />
                            </linearGradient>
                            <linearGradient id="endGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#e74c3c', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#c0392b', stopOpacity: 1 }} />
                            </linearGradient>
                            <linearGradient id="taskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#3498db', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#2980b9', stopOpacity: 1 }} />
                            </linearGradient>
                            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                                <polygon points="0 0, 8 3, 0 6" fill="#7f8c8d" />
                            </marker>
                        </defs>
                    </svg>
                </div>
            </div>

            {/* Task Columns */}
            <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Trạng Thái Hiện Tại</h2>
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex space-x-6 overflow-x-auto pb-6">
                        {Object.entries(columnState).map(([columnId, column]) => (
                            <div key={columnId} className="w-72 flex-shrink-0 bg-white rounded-xl shadow-md p-4">
                                <h3 className="text-lg font-bold text-indigo-600 mb-4">{column.name}</h3>
                                <Droppable droppableId={columnId}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="bg-gray-100 p-3 min-h-[250px] rounded-lg transition-all duration-300 hover:bg-gray-200"
                                        >
                                            {column.items.map((item, index) => (
                                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => handleTaskClick(item)}
                                                            className="bg-white p-3 mb-3 rounded-lg shadow-sm cursor-move hover:shadow-md transition-all duration-200 hover:bg-indigo-50"
                                                        >
                                                            <p className="text-sm font-medium text-gray-800">Order ID: {item.orderId}</p>
                                                            <p className="text-xs text-gray-500">Task: {taskNames[item.activityId]}</p>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>

            {/* Modal for Task Details */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-modal-in">
                        <h3 className="text-3xl font-bold text-indigo-600 mb-6">Chi Tiết Đơn Hàng</h3>
                        {taskDetails ? (
                            <div className="space-y-6">
                                <div className="border-b border-gray-200 pb-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <p className="text-lg"><strong className="text-gray-700">Mã đơn hàng:</strong> <span className="text-gray-900">{taskDetails.id}</span></p>
                                        <p className="text-lg"><strong className="text-gray-700">Ngày đặt:</strong> <span className="text-gray-900">{formatDate(taskDetails.orderDate)}</span></p>
                                        <p className="text-lg"><strong className="text-gray-700">Tổng tiền:</strong> <span className="text-indigo-600 font-semibold">{formatCurrency(taskDetails.totalAmount)}</span></p>
                                        <p className="text-lg"><strong className="text-gray-700">Trạng thái:</strong> <span className="text-green-600 font-medium">{taskDetails.status.replace('_', ' ')}</span></p>
                                        <p className="text-lg"><strong className="text-gray-700">Thanh toán:</strong> <span className={taskDetails.paymentStatus === 'ĐÃ_THANH_TOÁN' ? 'text-green-600' : 'text-red-600'}>{taskDetails.paymentStatus.replace('_', ' ')}</span></p>
                                        <p className="text-lg"><strong className="text-gray-700">Tác vụ:</strong> <span className="text-gray-900">{taskNames[selectedTask.activityId]}</span></p>
                                        <p className="text-lg col-span-2"><strong className="text-gray-700">ID người dùng:</strong> <span className="text-gray-900">{taskDetails.userId}</span></p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold text-gray-800 mb-4">Sản Phẩm Trong Đơn Hàng</h4>
                                    {taskDetails.orderDetails.map((detail, index) => (
                                        <div key={detail.id} className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                                            <div className="flex items-center space-x-4">
                                                <img
                                                    src={detail.product.imageUrls[0]}
                                                    alt={detail.product.name}
                                                    className="w-20 h-20 object-cover rounded-lg shadow-sm"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-lg font-medium text-gray-900">{detail.product.name}</p>
                                                    <p className="text-sm text-gray-600 italic">{detail.product.description}</p>
                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                        <p><strong className="text-gray-700">Số lượng:</strong> <span className="text-gray-900">{detail.quantity}</span></p>
                                                        <p><strong className="text-gray-700">Giá:</strong> <span className="text-indigo-600">{formatCurrency(detail.price)}</span></p>
                                                        <p><strong className="text-gray-700">Giảm giá:</strong> <span className="text-red-600">{detail.discount}%</span></p>
                                                        <p><strong className="text-gray-700">Danh mục:</strong> <span className="text-gray-900">{detail.product.categoryName}</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-lg flex items-center">
                                <svg className="animate-spin h-5 w-5 mr-3 text-indigo-500" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                                </svg>
                                Đang tải chi tiết...
                            </p>
                        )}
                        <button
                            onClick={closeModal}
                            className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskList;