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
} from "lucide-react";
import { Sparkles } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";

import PageMeta from "../../components/common/PageMeta";
import PopupAlert from "../../components/popUpAlert";
import { Link } from "react-router-dom";
import {
  deleteSubcategory,
  fetchSubcategories,
  Subcategory,
} from "../../store/slices/subCategory";
import { setSearchQuery } from "../../store/slices/subCategory";

// Delete Confirmation Modal Component
const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  category: Subcategory | null;
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

const SubcategoryList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { subcategories, loading, error, pagination, searchQuery, filters } =
    useAppSelector((state) => state.subcategory);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subcategoryToEdit, setSubcategoryToEdit] =
    useState<Subcategory | null>(null);
  const [subcategoryToDelete, setSubcategoryToDelete] =
    useState<Subcategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [localFilters, setLocalFilters] = useState<Record<string, any>>({});

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
      fetchSubcategories({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || "",
        filters: activeFilters,
        sortField: "createdAt",
        sortOrder: "desc",
      })
    );
  }, [dispatch, pagination.page, pagination.limit, searchQuery, localFilters]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      dispatch(
        fetchSubcategories({
          page: newPage,
          limit: pagination.limit,
          search: searchQuery || "",
          filters: {
            deletedAt: null,
            ...(localFilters.status ? { status: localFilters.status } : {}),
          },
          sortField: "createdAt",
          sortOrder: "desc",
        })
      );
    }
  };

  const handleLimitChange = (newLimit: number) => {
    dispatch(
      fetchSubcategories({
        page: 1,
        limit: newLimit,
        search: searchQuery || "",
        filters: {
          deletedAt: null,
          ...(localFilters.status ? { status: localFilters.status } : {}),
        },
        sortField: "createdAt",
        sortOrder: "desc",
      })
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    // filters are kept locally and the effect watching `localFilters` will
    // trigger fetchSubcategories; no global setFilters action for subcategories
    // so we avoid dispatching a non-existent action here.
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setLocalFilters({});
    // Reset search in the subcategory slice so the fetch effect runs
    dispatch(setSearchQuery(""));
  };

  const openEditModal = (category: Subcategory) => {
    setSubcategoryToEdit(category);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSubcategoryToEdit(null);
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
      fetchSubcategories({
        page: pagination.page,
        limit: pagination.limit,
        filters: activeFilters,
        search: searchQuery || "",
        sortField: "createdAt",
        sortOrder: "desc",
      })
    );
  };

  const openDeleteModal = (category: Subcategory) => {
    setSubcategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSubcategoryToDelete(null);
    setDeleteModalOpen(false);
    setIsDeleting(false);
  };

  const handleDeleteConfirm = async () => {
    if (subcategoryToDelete) {
      setIsDeleting(true);
      try {
        // Dispatch the delete action
        await dispatch(deleteSubcategory(subcategoryToDelete._id)).unwrap();

        setPopup({
          message: `Subcategory "${subcategoryToDelete.name}" deleted successfully`,
          type: "success",
          isVisible: true,
        });

        // Close modal and reset state
        closeDeleteModal();

        // Refresh the categories list
        const activeFilters = {
          deletedAt: null,
          ...(localFilters.status ? { status: localFilters.status } : {}),
        };

        dispatch(
          fetchSubcategories({
            page: pagination.page,
            limit: pagination.limit,
            filters: activeFilters,
            search: searchQuery || "",
            sortField: "createdAt",
            sortOrder: "desc",
          })
        );

        // Optional: Show success message
        // console.log(`Subcategory "${categoryToDelete.name}" deleted successfully`);
      } catch (error) {
        console.error("Failed to delete Subcategry:", error);
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
        title="Subcategory List | TailAdmin"
        description="List of all course subcategories in TailAdmin"
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
                Subcategories
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage and organize your course subcategories
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700">
              Total:{" "}
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {pagination.total ?? pagination.totalDocuments}
              </span>
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleResetFilters()}
                className="px-3 py-2 text-sm rounded-lg bg-white/0 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition"
              >
                <RotateCcw className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter (styled like EditSubcategory) */}
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
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Show:
              </span>
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
        {/* end search/filter */}
        {/* Error Message and Loading State are ...existing code... */}
        {/* Table */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 dark:bg-gray-900/30 divide-y divide-gray-100 dark:divide-gray-800">
                {subcategories.map((cat, idx) => (
                  <tr key={cat._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={`${import.meta.env.VITE_IMAGE_URL}/${cat?.image}`}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://tse1.mm.bing.net/th/id/OIP.FR4m6MpuRDxDsAZlyvKadQHaFL?pid=Api&P=0&h=180";
                        }}
                        alt={cat?.name || "No image"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {cat.name}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {cat.status === "Active" ? (
                        <CheckCircle className="text-green-500 h-5 w-5" />
                      ) : (
                        <XCircle className="text-red-500 h-5 w-5" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(cat.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link to={`/subcategory/edit/${cat._id}`}>
                        <button className="text-blue-500 hover:text-blue-700 transition-colors">
                          <Pencil className="h-5 w-5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => openDeleteModal(cat)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {generatePageNumbers().map((page, idx) =>
            typeof page === "number" ? (
              <button
                key={idx}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${pagination.page === page
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
              >
                {page}
              </button>
            ) : (
              <span key={idx} className="px-2 text-gray-400 dark:text-gray-500">
                {page}
              </span>
            )
          )}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
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
        category={subcategoryToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default SubcategoryList;
