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
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  deleteCategory,
  setSearchQuery,
} from "../../store/slices/categorySlice";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import {
  deleteModule,
  fetchModules,
  updateModule,
} from "../../store/slices/moduleSlice";
import EditModal from "./EditModal";

interface Category {
  _id: string;
  name: string;
  slug: string;
  status: "active" | "inactive";
  isDeleted: boolean;
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
                Delete Module
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
              Are you sure you want to delete the Module{" "}
              <strong className="text-gray-900 dark:text-white">
                "{category.name}"
              </strong>
              ?
            </p>
            {(category.status === "active" || category.status === "Active") && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Cannot Delete:</strong> This module is currently active.
                  Please set it to inactive before deleting.
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

const ModuleList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { modules, loading, error, searchQuery } = useAppSelector(
    (state) => state.modules
  );

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ModuleToDelete, setModuleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [ediModule, setEditModule] = useState<Category | null>(null);
  const [searchInput, setSearchInput] = useState("");
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
    dispatch(
      fetchModules({
        search: searchQuery || "", // Changed from searchFields to search
        sort: { createdAt: "desc" },
      })
    );
  }, [dispatch, searchQuery, localFilters]);

  const handleResetFilters = () => {
    setSearchInput("");
    setLocalFilters({});
    dispatch(
      fetchModules({
        search: searchQuery || "", // Changed from searchFields to search
        sort: { createdAt: "desc" },
      })
    );
  };

  const openDeleteModal = (Module: Module) => {
    setModuleToDelete(Module);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setModuleToDelete(null);
    setDeleteModalOpen(false);
    setIsDeleting(false);
  };

  const handelEditModule = async (data) => {
    try {
      // Dispatch the edit action
      await dispatch(updateModule(data)).unwrap();

      setPopup({
        message: `Module "${data.name}" edited successfully`,
        type: "success",
        isVisible: true,
      });

      // Close modal and reset state
      setEditModalOpen(false);
      setEditModule(null);

      dispatch(
        fetchModules({
          search: searchQuery || "", // Changed from searchFields to search
        })
      );
    } catch (error) {
      console.error("Failed to edit module:", error);
      setPopup({
        message: "Failed to edit module. Please try again.",
        type: "error",
        isVisible: true,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (ModuleToDelete) {
      // Check if module is active
      if (ModuleToDelete.status === "active" || ModuleToDelete.status === "Active") {
        setPopup({
          message: `Cannot delete active module "${ModuleToDelete.name}". Please set the module to inactive first.`,
          type: "error",
          isVisible: true,
        });
        closeDeleteModal();
        return;
      }

      setIsDeleting(true);
      try {
        // Dispatch the delete action
        await dispatch(deleteModule(ModuleToDelete._id)).unwrap();

        setPopup({
          message: `Module "${ModuleToDelete.name}" deleted successfully`,
          type: "success",
          isVisible: true,
        });

        // Close modal and reset state
        closeDeleteModal();

        dispatch(
          fetchModules({
            search: searchQuery || "", // Changed from searchFields to search
          })
        );

        // Optional: Show success message
        console.log(`Module "${ModuleToDelete.name}" deleted successfully`);
      } catch (error) {
        console.error("Failed to delete module:", error);
        setPopup({
          message: "Failed to delete module. Please try again.",
          type: "error",
          isVisible: true,
        });
        setIsDeleting(false);
      }
    }
  };

  return (
    <div>
      <PageMeta
        title=" Module List | TailAdmin"
        description="List of all course modules in TailAdmin"
      />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Modules
          </h1>
          <span className="text-gray-500 text-sm dark:text-gray-400">
            Total: {modules.length}
          </span>
        </div>

        {/* Search & Filter */}
        <div className="bg-white shadow p-4 rounded-md mb-6 dark:bg-gray-900">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            {/* <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={localFilters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div> */}

            {/* Limit */}
            {/* <div className="flex items-center gap-2">
              <span className="text-sm dark:text-gray-300">Show:</span>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div> */}

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-x-auto dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  #
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  Name
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-900 dark:divide-gray-800">
              {modules.map((cat, idx) => (
                <tr
                  key={cat._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {idx + 1}
                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {cat.name}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(cat.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditModule(cat);
                        setEditModalOpen(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
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
        category={ModuleToDelete}
        isDeleting={isDeleting}
      />

      <EditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditModule(null);
        }}
        onSubmit={handelEditModule}
        data={ediModule}
      />
    </div>
  );
};

export default ModuleList;
