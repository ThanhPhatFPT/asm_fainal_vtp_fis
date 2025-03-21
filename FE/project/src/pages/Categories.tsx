import React, { useState, useEffect } from 'react';
import { Edit, RefreshCw, Trash2, Plus, X } from 'lucide-react';
import CategoryService from '../service/CategoryService.js'; // Adjust path as needed
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Category {
  id: string;
  name: string;
  categoryImage: string;
  status: string;
}

interface FormErrors {
  name?: string;
  categoryImage?: string;
  status?: string;
}

export default function Categories() {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryImage: '',
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho phân trang, tìm kiếm, và sắp xếp
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const FALLBACK_IMAGE = 'https://via.placeholder.com/48?text=No+Image';

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await CategoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách danh mục!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      categoryImage: '',
      status: 'active',
    });
    setFormErrors({});
  };

  // Hàm validate form
  const validateForm = (data: typeof formData): FormErrors => {
    const errors: FormErrors = {};
    const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/i;

    // Validate name
    if (!data.name.trim()) {
      errors.name = 'Tên danh mục không được để trống!';
    } else if (data.name.length > 50) {
      errors.name = 'Tên danh mục không được vượt quá 50 ký tự!';
    }

    // Validate categoryImage
    if (!data.categoryImage.trim()) {
      errors.categoryImage = 'URL hình ảnh không được để trống!';
    } else if (!urlPattern.test(data.categoryImage)) {
      errors.categoryImage = 'URL hình ảnh phải là định dạng png, jpg, jpeg hoặc gif!';
    }

    // Validate status
    if (!['active', 'inactive'].includes(data.status)) {
      errors.status = 'Trạng thái không hợp lệ!';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Kiểm tra lỗi
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach((error) =>
          toast.error(error, { position: 'top-right', autoClose: 3000 })
      );
      setIsSubmitting(false);
      return;
    }

    try {
      await CategoryService.createCategory(formData);
      toast.success('Thêm danh mục thành công!', { position: 'top-right', autoClose: 2000 });
      setShowModal(false);
      resetForm();
      await fetchCategories();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Lỗi khi thêm danh mục!';
      toast.error(errorMsg, { position: 'top-right', autoClose: 2000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setIsSubmitting(true);

    // Kiểm tra lỗi
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach((error) =>
          toast.error(error, { position: 'top-right', autoClose: 3000 })
      );
      setIsSubmitting(false);
      return;
    }

    try {
      await CategoryService.updateCategory(selectedCategory.id, formData);
      toast.success('Cập nhật danh mục thành công!', { position: 'top-right', autoClose: 2000 });
      setShowEditModal(false);
      setSelectedCategory(null);
      resetForm();
      await fetchCategories();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Lỗi khi cập nhật danh mục!';
      toast.error(errorMsg, { position: 'top-right', autoClose: 2000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmAction = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const toastId = toast(
          <div>
            <p>{message}</p>
            <div className="flex justify-end space-x-2 mt-2">
              <button
                  onClick={() => {
                    toast.dismiss(toastId);
                    resolve(true);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Xác nhận
              </button>
              <button
                  onClick={() => {
                    toast.dismiss(toastId);
                    resolve(false);
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </div>,
          {
            position: 'top-center',
            autoClose: false,
            closeOnClick: false,
            draggable: false,
            closeButton: false,
          }
      );
    });
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const isDisabling = currentStatus === 'active';
    const action = isDisabling ? 'vô hiệu hóa' : 'khôi phục';
    const confirmed = await confirmAction(`Bạn có chắc muốn ${action} danh mục này?`);

    if (confirmed) {
      try {
        if (isDisabling) {
          await CategoryService.disableCategory(id);
          toast.success('Vô hiệu hóa danh mục thành công!', { position: 'top-right', autoClose: 1000 });
        } else {
          await CategoryService.restoreCategory(id);
          toast.success('Khôi phục danh mục thành công!', { position: 'top-right', autoClose: 1000 });
        }
        await fetchCategories();
      } catch (error) {
        const errorMsg = error.response?.data?.message || `Lỗi khi ${action} danh mục!`;
        toast.error(errorMsg, { position: 'top-right', autoClose: 1000 });
      }
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      categoryImage: category.categoryImage,
      status: category.status,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedCategory(null);
    resetForm();
  };

  // Logic xử lý tìm kiếm, sắp xếp và phân trang
  const filteredCategories = categories
      .filter((category) => category.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const fieldA = a[sortField].toLowerCase();
        const fieldB = b[sortField].toLowerCase();
        if (sortOrder === 'asc') {
          return fieldA > fieldB ? 1 : -1;
        } else {
          return fieldA < fieldB ? 1 : -1;
        }
      });

  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSort = (field: 'name' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
      <>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Quản lý danh mục</h3>
              <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                <span>Thêm danh mục</span>
              </button>
            </div>
            <div className="mt-4">
              <input
                  type="text"
                  placeholder="Tìm kiếm theo tên danh mục..."
                  className="w-full p-2 border rounded-lg"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
                <div className="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>
            ) : paginatedCategories.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Không tìm thấy danh mục nào</div>
            ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hình ảnh
                    </th>
                    <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('name')}
                    >
                      Tên danh mục {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('status')}
                    >
                      Trạng thái {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-100 transition duration-200 ease-in-out">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                              src={category.categoryImage}
                              alt={category.name}
                              className="h-12 w-12 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.src = FALLBACK_IMAGE;
                              }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                      <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {category.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                                className="text-blue-600 hover:text-blue-900"
                                title="Chỉnh sửa"
                                onClick={() => openEditModal(category)}
                            >
                              <Edit size={18} />
                            </button>
                            <button
                                className={
                                  category.status === 'active'
                                      ? 'text-red-600 hover:text-red-900'
                                      : 'text-green-600 hover:text-green-900'
                                }
                                title={category.status === 'active' ? 'Vô hiệu hóa' : 'Khôi phục'}
                                onClick={() => handleToggleStatus(category.id, category.status)}
                            >
                              {category.status === 'active' ? <Trash2 size={18} /> : <RefreshCw size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
            )}
            {!isLoading && totalItems > 0 && (
                <div className="p-4 flex justify-between items-center">
                  <div>
                    Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
                    {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} danh mục
                  </div>
                  <div className="flex space-x-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                      Trước
                    </button>
                    <span className="px-4 py-2">Trang {currentPage} / {totalPages}</span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>

        {/* Add Category Modal */}
        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center p-5 border-b">
                  <h3 className="text-xl font-semibold text-gray-800">Thêm danh mục mới</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tên danh mục</label>
                    <input
                        type="text"
                        className={`mt-2 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            formErrors.name ? 'border-red-500' : ''
                        }`}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">URL hình ảnh</label>
                    <input
                        type="url"
                        className={`mt-2 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            formErrors.categoryImage ? 'border-red-500' : ''
                        }`}
                        value={formData.categoryImage}
                        onChange={(e) => setFormData({ ...formData, categoryImage: e.target.value })}
                    />
                    {formErrors.categoryImage && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.categoryImage}</p>
                    )}
                    {formData.categoryImage && (
                        <div className="mt-4">
                          <img
                              src={formData.categoryImage}
                              alt="Xem trước ảnh"
                              className="w-full h-40 object-cover rounded-lg border"
                              onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                          />
                        </div>
                    )}
                  </div>
                  <div className="p-6 flex justify-end space-x-3 border-t">
                    <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition"
                        disabled={isSubmitting}
                    >
                      Hủy
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                        disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            <span>Đang xử lý...</span>
                          </>
                      ) : (
                          'Thêm danh mục'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* Edit Category Modal */}
        {showEditModal && selectedCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center p-5 border-b">
                  <h3 className="text-xl font-semibold text-gray-800">Chỉnh sửa danh mục</h3>
                  <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tên danh mục</label>
                    <input
                        type="text"
                        className={`mt-2 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            formErrors.name ? 'border-red-500' : ''
                        }`}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">URL hình ảnh</label>
                    <input
                        type="url"
                        className={`mt-2 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            formErrors.categoryImage ? 'border-red-500' : ''
                        }`}
                        value={formData.categoryImage}
                        onChange={(e) => setFormData({ ...formData, categoryImage: e.target.value })}
                    />
                    {formErrors.categoryImage && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.categoryImage}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                    <select
                        className={`mt-2 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            formErrors.status ? 'border-red-500' : ''
                        }`}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Không hoạt động</option>
                    </select>
                    {formErrors.status && <p className="mt-1 text-sm text-red-500">{formErrors.status}</p>}
                  </div>
                  <div className="p-6 flex justify-end space-x-3 border-t">
                    <button
                        type="button"
                        onClick={closeEditModal}
                        className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition"
                        disabled={isSubmitting}
                    >
                      Hủy
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                        disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            <span>Đang xử lý...</span>
                          </>
                      ) : (
                          'Cập nhật danh mục'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        <ToastContainer />
      </>
  );
}