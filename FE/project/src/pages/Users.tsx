import React, { useState, useEffect } from "react";
import { Edit, Ban, Plus, X, Unlock } from "lucide-react";
import userService from "../service/userService.js";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';

type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";
type Role = "USER" | "ADMIN";

interface User {
  userId: string;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
}

export default function Users() {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "USER" as Role,
    status: "ACTIVE" as UserStatus,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof User>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const fetchUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error("Lỗi khi lấy danh sách người dùng!");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      role: "USER" as Role,
      status: "ACTIVE" as UserStatus,
    });
    setErrors({});
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (isEdit: boolean = false) => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Họ tên không được để trống";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = "Mật khẩu không được để trống";
      } else if (formData.password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      }
    } else {
      if (formData.password && formData.password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      }
    }

    if (!["USER", "ADMIN"].includes(formData.role)) {
      newErrors.role = "Vai trò không hợp lệ";
    }

    if (!["ACTIVE", "INACTIVE", "BANNED"].includes(formData.status)) {
      newErrors.status = "Trạng thái không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(false)) {
      toast.error("Vui lòng kiểm tra lại thông tin nhập!", { position: 'top-right', autoClose: 3000 });
      return;
    }

    try {
      console.log("🟢 Dữ liệu gửi đi:", formData);
      const response = await userService.createUser(formData);
      console.log("✅ Phản hồi từ server:", response);

      const newUser: User = {
        userId: response.userId,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };

      setUsers([newUser, ...users]);
      setSortField("fullName");
      setSortDirection("asc");
      setSearchTerm("");
      toast.success("Thêm người dùng thành công!", { position: 'top-right', autoClose: 3000 });
      setShowModal(false);
      resetForm();
      setCurrentPage(1);
    } catch (error: any) {
      console.error("❌ Lỗi khi thêm người dùng:", error);
      toast.error(error.response?.data?.message || "Lỗi khi thêm người dùng!", { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!validateForm(true)) {
      toast.error("Vui lòng kiểm tra lại thông tin nhập!", { position: 'top-right', autoClose: 3000 });
      return;
    }

    try {
      console.log("🟢 Dữ liệu cập nhật:", formData);
      const response = await userService.updateUser(selectedUser.userId, formData);
      console.log("✅ Phản hồi từ server:", response);
      toast.success("Cập nhật người dùng thành công!", { position: 'top-right', autoClose: 3000 });
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error("❌ Lỗi khi cập nhật người dùng:", error);
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật người dùng!", { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      if (user.status === "BANNED") {
        const updatedUser = await userService.restoreUser(user.userId);
        toast.success("Khôi phục người dùng thành công!", { position: 'top-right', autoClose: 1000 });
        setUsers(users.map(u => u.userId === user.userId ? updatedUser : u));
      } else {
        const updatedUser = await userService.deleteUser(user.userId);
        toast.success("Khóa người dùng thành công!", { position: 'top-right', autoClose: 1000 });
        setUsers(users.map(u => u.userId === user.userId ? updatedUser : u));
      }
    } catch (error: any) {
      console.error("❌ Lỗi khi thay đổi trạng thái:", error);
      toast.error(error.response?.data?.message || "Lỗi khi thay đổi trạng thái!", { position: 'top-right', autoClose: 1000 });
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
    setErrors({});
    setShowEditModal(true);
  };

  const closeAddModal = () => {
    setShowModal(false);
    resetForm();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    resetForm();
  };

  const filteredUsers = users.filter(user =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const valueA = a[sortField];
    const valueB = b[sortField];
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    }
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
      <>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Quản lý người dùng</h3>
            <div className="flex items-center space-x-4">
              <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="p-2 border rounded"
              />
              <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                <span>Thêm người dùng</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
              <tr>
                {["fullName", "email", "role", "status"].map((field) => (
                    <th
                        key={field}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                        onClick={() => handleSort(field as keyof User)}
                    >
                      {field === "fullName" && "Họ tên"}
                      {field === "email" && "Email"}
                      {field === "role" && "Vai trò"}
                      {field === "status" && "Trạng thái"}
                      {sortField === field && (
                          <span>{sortDirection === "asc" ? " ↑" : " ↓"}</span>
                      )}
                    </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
              </thead>
              <motion.tbody
                  key={currentPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
              >
                {currentUsers.map((user) => (
                    <tr
                        key={user.userId}
                        className="hover:bg-gray-100 transition duration-200 ease-in-out"
                    >
                      <td className="px-6 py-4 whitespace-nowrap flex items-center">
                        <img
                            className="h-10 w-10 rounded-full"
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}`}
                            alt=""
                        />
                        <div className="ml-4 text-sm font-medium text-gray-900">{user.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
                            }`}
                        >
                          {user.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.status === "ACTIVE"
                                    ? "bg-green-100 text-green-800"
                                    : user.status === "BANNED"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                            }`}
                        >
                          {user.status === "ACTIVE"
                              ? "Hoạt động"
                              : user.status === "BANNED"
                                  ? "Đã khóa"
                                  : "Không hoạt động"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                              className="text-blue-600 hover:text-blue-900"
                              title="Chỉnh sửa"
                              onClick={() => openEditModal(user)}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                              className={user.status === "BANNED" ? "text-green-600 hover:text-green-900" : "text-red-600 hover:text-red-900"}
                              title={user.status === "BANNED" ? "Khôi phục tài khoản" : "Khóa tài khoản"}
                              onClick={() => handleToggleStatus(user)}
                          >
                            {user.status === "BANNED" ? <Unlock size={18} /> : <Ban size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
              </motion.tbody>
            </table>
          </div>

          {totalPages > 1 && (
              <div className="p-6 flex justify-between items-center">
                <div>
                  Hiển thị {indexOfFirstItem + 1} -{" "}
                  {Math.min(indexOfLastItem, sortedUsers.length)} trong số{" "}
                  {sortedUsers.length} người dùng
                </div>
                <div className="flex space-x-2">
                  <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                      <button
                          key={i + 1}
                          onClick={() => paginate(i + 1)}
                          className={`px-4 py-2 border rounded ${
                              currentPage === i + 1 ? "bg-blue-600 text-white" : ""
                          }`}
                      >
                        {i + 1}
                      </button>
                  ))}
                  <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
          )}
        </div>

        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b">
                  <h3 className="text-lg font-semibold">Thêm người dùng mới</h3>
                  <button onClick={closeAddModal} className="text-gray-400 hover:text-gray-500">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <input
                        type="text"
                        required
                        className={`w-full p-2 border rounded ${errors.fullName ? "border-red-500" : ""}`}
                        placeholder="Họ tên"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <input
                        type="email"
                        required
                        className={`w-full p-2 border rounded ${errors.email ? "border-red-500" : ""}`}
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <input
                        type="password"
                        required
                        minLength={6}
                        className={`w-full p-2 border rounded ${errors.password ? "border-red-500" : ""}`}
                        placeholder="Mật khẩu"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>
                  <select
                      className="w-full p-2 border rounded"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  >
                    <option value="USER">Người dùng</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                  <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Thêm người dùng
                  </button>
                </form>
              </div>
            </div>
        )}

        {showEditModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b">
                  <h3 className="text-lg font-semibold">Chỉnh sửa người dùng</h3>
                  <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-500">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                  <div>
                    <input
                        type="text"
                        required
                        className={`w-full p-2 border rounded ${errors.fullName ? "border-red-500" : ""}`}
                        placeholder="Họ tên"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <input
                        type="email"
                        required
                        className={`w-full p-2 border rounded ${errors.email ? "border-red-500" : ""}`}
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <input
                        type="password"
                        className={`w-full p-2 border rounded ${errors.password ? "border-red-500" : ""}`}
                        placeholder="Mật khẩu mới (để trống nếu không đổi)"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>
                  <select
                      className="w-full p-2 border rounded"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  >
                    <option value="USER">Người dùng</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                  <select
                      className="w-full p-2 border rounded"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Không hoạt động</option>
                    <option value="BANNED">Đã khóa</option>
                  </select>
                  <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Cập nhật người dùng
                  </button>
                </form>
              </div>
            </div>
        )}

        <ToastContainer />
      </>
  );
}