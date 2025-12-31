import React, { useEffect, useState } from "react";

import {
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  AlertTriangle,
  Sparkles,
  Grid3x3,
  List,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  deleteCategory,
  fetchCategories,
  setSearchQuery,
  setFilters,
  resetFilters,
} from "../../store/slices/categorySlice";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import { Link } from "react-router";

interface Category {
  _id: string;
  name: string;
  slug: string;
  status: "active" | "inactive";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  subCategoryCount: number;
}

// Delete Confirmation Modal Component
const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  category: Category | null;
  isDeleting: boolean;
}> = ({ isOpen, onClose, onConfirm, category, isDeleting }) => {
  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-transparent backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Category
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete the category{" "}
              <strong className="text-gray-900 dark:text-white">
                "{category.name}"
              </strong>
              ?
            </p>
            {(category.status === "active" || category.status === "Active") && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Cannot Delete:</strong> This category is currently active.
                  Please set it to inactive before deleting.
                </p>
              </div>
            )}
            {category.subCategoryCount > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Warning:</strong> This category has{" "}
                  {category.subCategoryCount} subcategory(ies). Deleting this
                  category may affect related subcategories.
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { categories, loading, error, pagination, searchQuery, filters } =
    useAppSelector((state) => state.category);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [localFilters, setLocalFilters] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState('table');

  const [popup, setPopup] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        dispatch(setSearchQuery(searchInput));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, dispatch]);

  // Fetch categories - FIXED: Using 'search' instead of 'searchFields'
  useEffect(() => {
    const activeFilters = {
      deletedAt: null,
      ...(localFilters.status ? { status: localFilters.status } : {}),
    };

    dispatch(
      fetchCategories({
        page: pagination.page,
        limit: pagination.limit,
        filters: activeFilters,
        search: searchQuery || "", // Changed from searchFields to search
        sortField: "createdAt",
        sortOrder: "desc",
      })
    );
  }, [dispatch, pagination.page, pagination.limit, searchQuery, localFilters]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      dispatch(
        fetchCategories({
          page: newPage,
          limit: pagination.limit,
          filters: {
            deletedAt: null,
            ...(localFilters.status ? { status: localFilters.status } : {}),
          },
          search: searchQuery || "", // Changed from searchFields to search
          sortField: "createdAt",
          sortOrder: "desc",
        })
      );
    }
  };

  const handleLimitChange = (newLimit: number) => {
    dispatch(
      fetchCategories({
        page: 1,
        limit: newLimit,
        filters: {
          deletedAt: null,
          ...(localFilters.status ? { status: localFilters.status } : {}),
        },
        search: searchQuery || "", // Changed from searchFields to search
        sortField: "createdAt",
        sortOrder: "desc",
      })
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    dispatch(setFilters(updated));
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setLocalFilters({});
    dispatch(resetFilters());
  };

  const openEditModal = (category: Category) => {
    setCategoryToEdit(category);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setCategoryToEdit(null);
    setEditModalOpen(false);
  };

  const handleEditSuccess = () => {
    // Refresh the categories list after successful edit
    const activeFilters = {
      deletedAt: null,
      ...(localFilters.status ? { status: localFilters.status } : {}),
    };

    setPopup({
      message: "Category updated successfully",
      type: "success",
      isVisible: true,
    });
    dispatch(
      fetchCategories({
        page: pagination.page,
        limit: pagination.limit,
        filters: activeFilters,
        search: searchQuery || "", // Changed from searchFields to search
        sortField: "createdAt",
        sortOrder: "desc",
      })
    );
  };

  const openDeleteModal = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setCategoryToDelete(null);
    setDeleteModalOpen(false);
    setIsDeleting(false);
  };

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      // Check if category is active
      if (categoryToDelete.status === "active" || categoryToDelete.status === "Active") {
        setPopup({
          message: `Cannot delete active category "${categoryToDelete.name}". Please set the category to inactive first.`,
          type: "error",
          isVisible: true,
        });
        closeDeleteModal();
        return;
      }

      setIsDeleting(true);
      try {
        // Dispatch the delete action
        await dispatch(deleteCategory(categoryToDelete._id)).unwrap();

        setPopup({
          message: `Category "${categoryToDelete.name}" deleted successfully`,
          type: "success",
          isVisible: true,
        });

        // Close modal and reset state
        closeDeleteModal();

        // Refresh the categories list
        const activeFilters = {
          deletedAt: null,
          ...(localFilters.status
            ? { status: localFilters.status ? "Active" : "Inactive" }
            : {}),
        };

        dispatch(
          fetchCategories({
            page: pagination.page,
            limit: pagination.limit,
            filters: activeFilters,
            search: searchQuery || "", // Changed from searchFields to search
            sortField: "createdAt",
            sortOrder: "desc",
          })
        );

        // Optional: Show success message
        console.log(`Category "${categoryToDelete.name}" deleted successfully`);
      } catch (error) {
        console.error("Failed to delete category:", error);
        setPopup({
          message: "Failed to delete category. Please try again.",
          type: "error",
          isVisible: true,
        });
        setIsDeleting(false);
      }
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    const current = pagination.page;
    const maxPages = 5;

    const start = Math.max(1, current - Math.floor(maxPages / 2));
    const end = Math.min(totalPages, start + maxPages - 1);

    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("...", totalPages);

    return pages;
  };

  return (
    <div>
      <PageMeta
        title="Category List | TailAdmin"
        description="List of all course categories in TailAdmin"
      />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-gray-50/50 to-white dark:border-gray-800 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900 px-5 py-7 xl:px-10 xl:py-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Categories
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage and organize your course categories
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700">
              Total: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{pagination.totalDocuments ?? pagination.total}</span>
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6 rounded-2xl mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-indigo-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name..."
                className="pl-12 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-900/50 dark:text-white transition-all shadow-sm hover:shadow-md"
              />
            </div>

            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-4 rounded-xl">
              <Filter className="h-5 w-5 text-indigo-500" />
              <select
                value={localFilters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="bg-transparent border-none px-3 py-3 focus:ring-0 dark:text-white cursor-pointer font-medium outline-none"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-4 rounded-xl">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Show:</span>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-transparent border-none px-3 py-3 focus:ring-0 dark:text-white cursor-pointer font-medium outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all shadow-sm hover:shadow-md font-medium text-gray-700 dark:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Error Message */}
        {/* {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )} */}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-gray-300">#</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-gray-300">Image</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-gray-300">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-gray-300">Subcategories</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-gray-300">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 dark:bg-gray-900/30 divide-y divide-gray-100 dark:divide-gray-800">
                  {((Array.isArray(categories) ? categories : [])).filter(Boolean).map((cat, idx) => (
                    <tr
                      key={cat._id}
                      className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group"
                    >
                      <td className="px-6 py-5 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td className="px-6 py-5">
                        <div className="relative">
                          <img
                            src={`${import.meta.env.VITE_IMAGE_URL}/${cat?.image}`}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                "https://tse1.mm.bing.net/th/id/OIP.FR4m6MpuRDxDsAZlyvKadQHaFL?pid=Api&P=0&h=180";
                            }}
                            alt={cat?.name || "No image"}
                            className="w-12 h-12 rounded-xl object-cover shadow-md ring-2 ring-white dark:ring-gray-800 group-hover:ring-indigo-500 transition-all"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 rounded-xl transition-all"></div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-gray-900 dark:text-white">
                        {cat.name}
                      </td>
                      <td className="px-6 py-5 text-sm">
                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium">
                          {cat.subCategoryCount}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm">
                        {cat.status === "active" || cat?.status === "Active" ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <CheckCircle className="text-green-500 h-5 w-5" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <XCircle className="text-red-500 h-5 w-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {new Date(cat.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/category/edit/${cat._id}`}>
                            <button className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shadow-sm hover:shadow-md">
                              <Pencil className="h-4 w-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => openDeleteModal(cat)}
                            className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all shadow-sm hover:shadow-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {((Array.isArray(categories) ? categories : [])).filter(Boolean).map((cat, idx) => (
              <div
                key={cat._id}
                className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={`${import.meta.env.VITE_IMAGE_URL}/${cat?.image}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://tse1.mm.bing.net/th/id/OIP.FR4m6MpuRDxDsAZlyvKadQHaFL?pid=Api&P=0&h=180";
                    }}
                    alt={cat?.name || "No image"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    {cat.status === "active" || cat?.status === "Active" ? (
                      <span className="px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white rounded-lg text-xs font-medium flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white rounded-lg text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-3 py-1 bg-indigo-500/90 backdrop-blur-sm text-white rounded-lg text-xs font-medium">
                      {cat.subCategoryCount} Subcategories
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Created {new Date(cat.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <Link to={`/category/edit/${cat._id}`} className="flex-1">
                      <button className="w-full p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center justify-center gap-2 font-medium">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => openDeleteModal(cat)}
                      className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{((pagination?.page ?? 1) - 1) * (pagination?.limit ?? 1) + 1}</span> to{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{Math.min((pagination?.page ?? 1) * (pagination?.limit ?? 1), pagination?.totalDocuments ?? 0)}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{pagination?.totalDocuments ?? 0}</span> results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-xl border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {generatePageNumbers().map((page, idx) =>
              typeof page === "number" ? (
                <button
                  key={idx}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all shadow-sm hover:shadow-md ${pagination.page === page
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                    }`}
                >
                  {page}
                </button>
              ) : (
                <span key={idx} className="px-2 py-2 text-gray-400 dark:text-gray-500">
                  {page}
                </span>
              )
            )}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-xl border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />
      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        category={categoryToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CategoryList;