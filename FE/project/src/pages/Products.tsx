import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, X, ImagePlus, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, FileText } from "lucide-react";
import ProductService from "../service/ProductService.js";
import CategoryService from "../service/CategoryService.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from 'axios';
import Cookies from 'js-cookie';
import { storage, ref, uploadBytesResumable, getDownloadURL }  from '../../src/firebaseConfig.ts';  // Adjust path to your firebase-config file

// Cấu hình Axios với base URL
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api',
});

axiosInstance.interceptors.request.use(
    (config) => {
      const token = Cookies.get('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
);

interface Category {
  id: string;
  name: string;
  categoryImage: string;
  status?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  description: string;
  imageUrls: string[];
  category: Category;
  status: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductForImages, setSelectedProductForImages] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    quantity: 0,
    discount: 0,
    description: "",
    imageUrls: [] as string[],
    categoryId: "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]); // State cho các file ảnh khi thêm/sửa sản phẩm
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]); // State cho các file ảnh mới trong modal thêm ảnh
  const [uploadProgress, setUploadProgress] = useState<number[]>([]); // Theo dõi tiến trình upload
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortField, setSortField] = useState<keyof Product | "category.name" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await ProductService.getAllProducts();
      setProducts(response.data || []);
    } catch (error: any) {
      console.error("Lỗi khi tải sản phẩm:", error);
      setProducts([]);
      toast.error("Không thể tải danh sách sản phẩm: " + (error.message || "Lỗi mạng"));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await CategoryService.getAllCategories();
      const activeCategories = response.filter((cat: Category) => cat.status === "active");
      setCategories(activeCategories);
    } catch (error: any) {
      console.error("Lỗi khi tải danh mục:", error);
      setCategories([]);
      toast.error("Không thể tải danh sách danh mục: " + (error.message || "Lỗi mạng"));
    } finally {
      setLoading(false);
    }
  };

  const uploadFilesToFirebase = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map((file, index) => {
      return new Promise<string>((resolve, reject) => {
        const fileName = `${Date.now()}-${index}-${file.name}`;
        const storageRef = ref(storage, `products/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress((prev) => {
                const newProgress = [...prev];
                newProgress[index] = progress;
                return newProgress;
              });
            },
            (error) => {
              console.error("Lỗi khi tải ảnh lên Firebase:", error);
              toast.error("Không thể tải ảnh lên Firebase: " + error.message);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              } catch (error) {
                console.error("Lỗi khi lấy URL ảnh:", error);
                reject(error);
              }
            }
        );
      });
    });

    return Promise.all(uploadPromises);
  };

  const handleToggleStatus = async (id: string) => {
    const confirmToast = toast(
        ({ closeToast }) => (
            <div>
              <p>Bạn có chắc chắn muốn chuyển đổi trạng thái sản phẩm?</p>
              <div className="flex gap-2 mt-2">
                <button
                    className="bg-red-500 text-white px-3 py-1 rounded"
                    onClick={() => {
                      toggleStatus(id);
                      closeToast();
                    }}
                >
                  Xác nhận
                </button>
                <button className="bg-gray-300 px-3 py-1 rounded" onClick={closeToast}>
                  Hủy
                </button>
              </div>
            </div>
        ),
        { autoClose: false, closeOnClick: false }
    );
  };

  const toggleStatus = async (id: string) => {
    setLoading(true);
    try {
      await ProductService.toggleProductStatus(id);
      toast.success("Chuyển đổi trạng thái thành công!");
      fetchProducts();
    } catch (error: any) {
      console.error("Lỗi khi chuyển trạng thái:", error);
      toast.error(error.response?.data?.message || "Lỗi khi chuyển trạng thái: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedCategory = categories.find((cat) => cat.id === formData.categoryId);
      if (!selectedCategory) throw new Error("Vui lòng chọn danh mục hợp lệ");
      if (imageFiles.length === 0 && !editingProduct) throw new Error("Vui lòng thêm ít nhất một ảnh");

      let uploadedImageUrls = formData.imageUrls;
      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadFilesToFirebase(imageFiles);
      }

      const productData = {
        name: formData.name.trim(),
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        discount: Number(formData.discount) || 0,
        description: formData.description.trim(),
        imageUrls: uploadedImageUrls,
        category: {
          id: selectedCategory.id,
          name: selectedCategory.name,
          categoryImage: selectedCategory.categoryImage || "",
          status: selectedCategory.status || "active",
        },
        status: "ACTIVE",
      };

      if (editingProduct) {
        await ProductService.updateProduct(editingProduct.id, productData);
        toast.success("Cập nhật sản phẩm thành công!");
      } else {
        await ProductService.createProduct(productData);
        toast.success("Thêm sản phẩm thành công!");
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error("Lỗi khi xử lý sản phẩm:", error);
      toast.error(error.message || `Lỗi khi ${editingProduct ? "cập nhật" : "thêm"} sản phẩm`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      discount: product.discount,
      description: product.description,
      imageUrls: [...product.imageUrls],
      categoryId: product.category?.id || "",
    });
    setImageFiles([]); // Reset file khi chỉnh sửa
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", price: 0, quantity: 0, discount: 0, description: "", imageUrls: [], categoryId: "" });
    setImageFiles([]);
    setUploadProgress([]);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const handleAddImages = (product: Product) => {
    setSelectedProductForImages(product);
    setNewImageFiles([]);
    setUploadProgress([]);
    setShowImageModal(true);
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForImages) return;

    setLoading(true);
    try {
      let updatedImageUrls = [...selectedProductForImages.imageUrls];
      if (newImageFiles.length > 0) {
        const newUrls = await uploadFilesToFirebase(newImageFiles);
        updatedImageUrls = [...updatedImageUrls, ...newUrls];
      }

      const updatedProduct = {
        ...selectedProductForImages,
        imageUrls: updatedImageUrls,
      };

      await ProductService.updateProduct(selectedProductForImages.id, updatedProduct);
      toast.success("Thêm ảnh thành công!");
      setShowImageModal(false);
      setSelectedProductForImages(null);
      fetchProducts();
    } catch (error: any) {
      console.error("Lỗi khi thêm ảnh:", error);
      toast.error(error.message || "Lỗi khi thêm ảnh vào sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (index: number) => {
    if (!selectedProductForImages) return;

    setLoading(true);
    try {
      const updatedImageUrls = selectedProductForImages.imageUrls.filter((_, i) => i !== index);
      const updatedProduct = {
        ...selectedProductForImages,
        imageUrls: updatedImageUrls,
      };

      await ProductService.updateProduct(selectedProductForImages.id, updatedProduct);
      toast.success("Xóa ảnh thành công!");
      setSelectedProductForImages(updatedProduct);
      fetchProducts();
    } catch (error: any) {
      console.error("Lỗi khi xóa ảnh:", error);
      toast.error(error.message || "Lỗi khi xóa ảnh");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: "pdf" | "excel") => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/reports`, {
        params: { format },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `products_report_${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Xuất báo cáo ${format.toUpperCase()} thành công!`);
    } catch (error: any) {
      console.error("Lỗi khi xuất báo cáo:", error);
      const errorMessage = error.response?.data?.message || error.message || "Lỗi khi xuất báo cáo";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (!validTypes.includes(file.type)) {
        throw new Error('Vui lòng chọn file Excel (.xls hoặc .xlsx)');
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File quá lớn, kích thước tối đa là 10MB');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post('/products/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data?.message || !response.data?.importedCount) {
        throw new Error('Phản hồi từ server không hợp lệ');
      }

      toast.success(`${response.data.message}: ${response.data.importedCount} sản phẩm`);
      await fetchProducts();
    } catch (error: any) {
      console.error('Lỗi khi import Excel:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi import file Excel';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSort = (field: keyof Product | "category.name") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const filteredProducts = products
      .filter(
          (product) =>
              (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (product.category?.name || "").toLowerCase().includes(searchTerm.toLowerCase())) &&
              (statusFilter === "" || product.status === statusFilter)
      )
      .sort((a, b) => {
        if (!sortField) return 0;
        if (sortField === "category.name") {
          const nameA = a.category?.name || "";
          const nameB = b.category?.name || "";
          return sortDirection === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        return sortDirection === "asc"
            ? a[sortField] > b[sortField]
                ? 1
                : -1
            : a[sortField] < b[sortField]
                ? 1
                : -1;
      });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  return (
      <>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Quản lý sản phẩm</h3>
              <div className="flex space-x-4">
                <button
                    onClick={() => handleExportReport("pdf")}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    disabled={loading}
                >
                  <FileText size={20} />
                  <span>Xuất PDF</span>
                </button>
                <button
                    onClick={() => handleExportReport("excel")}
                    className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:bg-gray-400"
                    disabled={loading}
                >
                  <FileText size={20} />
                  <span>Xuất Excel</span>
                </button>
                <label
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 cursor-pointer"
                >
                  <FileText size={20} />
                  <span>Import Excel</span>
                  <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleImportExcel}
                      disabled={loading}
                  />
                </label>
                <button
                    onClick={() => {
                      resetForm();
                      setShowModal(true);
                    }}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    disabled={loading}
                >
                  <Plus size={20} />
                  <span>Thêm sản phẩm</span>
                </button>
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, mô tả hoặc danh mục..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
                <div className="text-center py-4">Đang tải...</div>
            ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                  <tr>
                    <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("name")}
                    >
                      Sản phẩm {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("category.name")}
                    >
                      Danh mục {sortField === "category.name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("price")}
                    >
                      Giá {sortField === "price" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("quantity")}
                    >
                      Số lượng {sortField === "quantity" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("discount")}
                    >
                      Giảm giá {sortField === "discount" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.length > 0 ? (
                      paginatedProducts.map((product) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-12 w-12 flex-shrink-0">
                                  <img
                                      className="h-12 w-12 rounded-lg object-cover"
                                      src={product.imageUrls[0] || "https://via.placeholder.com/48"}
                                      alt={product.name}
                                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/48")}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {product.description.length > 30
                                        ? `${product.description.slice(0, 30)}...`
                                        : product.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {product.category?.name || "Không có danh mục"}
                        </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatPrice(product.price)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{product.discount}%</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                        <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                product.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                        >
                          {product.status}
                        </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button
                                    onClick={() => handleEdit(product)}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                    disabled={loading}
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleAddImages(product)}
                                    className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                                    disabled={loading}
                                >
                                  <ImagePlus size={18} />
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(product.id)}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                    disabled={loading}
                                >
                                  {product.status === "ACTIVE" ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                      ))
                  ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-gray-500">
                          Không có sản phẩm nào
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
            )}
          </div>

          {filteredProducts.length > itemsPerPage && (
              <div className="flex justify-between items-center mt-4 p-6">
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

        {/* Modal thêm hoặc chỉnh sửa sản phẩm */}
        {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md sm:max-w-lg md:max-w-xl">
                <div className="flex justify-between mb-4">
                  <h2 className="text-lg font-semibold">{editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</h2>
                  <button
                      onClick={() => {
                        setShowModal(false);
                        setEditingProduct(null);
                        resetForm();
                      }}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      disabled={loading}
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        required
                        disabled={loading}
                        placeholder="Nhập tên sản phẩm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá</label>
                      <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          required
                          min="0"
                          disabled={loading}
                          placeholder="Nhập giá"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                      <input
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          required
                          min="0"
                          disabled={loading}
                          placeholder="Nhập số lượng"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá (%)</label>
                      <input
                          type="number"
                          value={formData.discount}
                          onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          min="0"
                          max="100"
                          disabled={loading}
                          placeholder="Nhập % giảm giá"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        required
                        disabled={loading}
                        placeholder="Nhập mô tả sản phẩm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh sản phẩm</label>
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        multiple
                        onChange={(e) => setImageFiles(e.target.files ? Array.from(e.target.files) : [])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                        disabled={loading}
                    />
                    {uploadProgress.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {uploadProgress.map((progress, index) => (
                              progress > 0 && progress < 100 && (
                                  <div key={index} className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                  </div>
                              )
                          ))}
                        </div>
                    )}
                    {imageFiles.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {imageFiles.map((file, index) => (
                              <img
                                  key={index}
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index}`}
                                  className="h-16 w-16 object-cover rounded-lg"
                              />
                          ))}
                        </div>
                    )}
                    {editingProduct && formData.imageUrls.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {formData.imageUrls.map((url, index) => (
                              <img
                                  key={index}
                                  src={url}
                                  alt={`Existing ${index}`}
                                  className="h-16 w-16 object-cover rounded-lg"
                                  onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/64")}
                              />
                          ))}
                        </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                    <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        required
                        disabled={loading || categories.length === 0}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                      ))}
                    </select>
                  </div>
                  <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                      disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : editingProduct ? "Cập nhật" : "Thêm mới"}
                  </button>
                </form>
              </div>
            </div>
        )}

        {/* Modal thêm ảnh */}
        {showImageModal && selectedProductForImages && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <div className="flex justify-between mb-4">
                  <h2 className="text-lg font-semibold">Thêm ảnh cho "{selectedProductForImages.name}"</h2>
                  <button
                      onClick={() => setShowImageModal(false)}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      disabled={loading}
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleImageSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Danh sách ảnh hiện tại</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedProductForImages.imageUrls.length > 0 ? (
                          selectedProductForImages.imageUrls.map((url, index) => (
                              <div key={index} className="relative">
                                <img
                                    src={url}
                                    alt={`Ảnh ${index + 1}`}
                                    className="h-16 w-16 object-cover rounded-lg"
                                    onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/64")}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleDeleteImage(index)}
                                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 disabled:opacity-50"
                                    disabled={loading}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                          ))
                      ) : (
                          <p className="text-sm text-gray-500">Chưa có ảnh nào</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thêm ảnh mới</label>
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        multiple
                        onChange={(e) => setNewImageFiles(e.target.files ? Array.from(e.target.files) : [])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                        disabled={loading}
                    />
                    {uploadProgress.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {uploadProgress.map((progress, index) => (
                              progress > 0 && progress < 100 && (
                                  <div key={index} className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                  </div>
                              )
                          ))}
                        </div>
                    )}
                    {newImageFiles.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {newImageFiles.map((file, index) => (
                              <img
                                  key={index}
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index}`}
                                  className="h-16 w-16 object-cover rounded-lg"
                              />
                          ))}
                        </div>
                    )}
                  </div>
                  <button
                      type="submit"
                      className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-400"
                      disabled={loading || newImageFiles.length === 0}
                  >
                    {loading ? "Đang xử lý..." : "Thêm ảnh"}
                  </button>
                </form>
              </div>
            </div>
        )}
      </>
  );
}