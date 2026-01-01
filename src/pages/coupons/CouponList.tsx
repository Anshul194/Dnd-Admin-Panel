import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteCoupon, fetchCoupons } from "../../store/slices/coupon";
import { RootState, AppDispatch } from "../../store";
import {
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import PopupAlert from "../../components/popUpAlert";
import PageMeta from "../../components/common/PageMeta";
import { Link, useLocation } from "react-router-dom"; // changed to react-router-dom

// Local Coupon type (match slice)
interface Coupon {
  _id?: string;
  code: string;
  type: string;
  value: number;
  isActive: boolean;
  expiresAt?: string;
  endAt?: string; // Backend might return endAt instead of expiresAt
  usageLimit: number;
  usedCount: number;
  minCartValue: number;
  [key: string]: any;
}

// Delete Confirmation Modal Component
const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  coupon: Coupon | null;
  isDeleting: boolean;
}> = ({ isOpen, onClose, onConfirm, coupon, isDeleting }) => {
  if (!isOpen || !coupon) return null;

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
                Delete Coupon
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
              Are you sure you want to delete the Coupon{" "}
              <strong className="text-gray-900 dark:text-white">
                "{coupon.code}"
              </strong>
              ?
            </p>
            {coupon.isActive && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Cannot Delete:</strong> This coupon is currently active.
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

// Helper function to format expiry date safely
const formatExpiryDate = (coupon: Coupon): string => {
  // Backend uses endAt (not expiresAt)
  const expiryDate = coupon.endAt || coupon.expiresAt;
  
  // Check for null, undefined, empty string, or string "null"/"undefined"
  if (!expiryDate || 
      expiryDate === '' || 
      expiryDate === null || 
      expiryDate === undefined ||
      String(expiryDate).trim() === '' ||
      String(expiryDate).toLowerCase() === 'null' ||
      String(expiryDate).toLowerCase() === 'undefined' ||
      String(expiryDate).toLowerCase() === 'invalid date') {
    return "No expiry";
  }
  
  try {
    // Convert to string first to check for "Invalid Date" string
    const dateStr = String(expiryDate);
    if (dateStr.toLowerCase() === 'invalid date' || dateStr === 'NaN') {
      return "No expiry";
    }
    
    const date = new Date(expiryDate);
    
    // Check if date is valid
    if (isNaN(date.getTime()) || date.toString() === 'Invalid Date') {
      return "No expiry";
    }
    
    // Format the date as MM/DD/YYYY
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const formatted = `${month}/${day}/${year}`;
    
    // Final safety check - ensure the formatted result is valid
    if (!formatted || formatted === 'Invalid Date' || formatted.toLowerCase().includes('invalid')) {
      return "No expiry";
    }
    
    return formatted;
  } catch (error) {
    // If any error occurs, return "No expiry"
    return "No expiry";
  }
};

const CouponList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, coupons } = useSelector(
    (state: RootState) => state.coupon
  );

  // Local state for search, filter, pagination, popup
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [popup, setPopup] = useState({
    message: "",
    type: "success",
    isVisible: false,
  });

  const closeDeleteModal = () => {
    setCouponToDelete(null);
    setDeleteModalOpen(false);
    setIsDeleting(false);
  };

  // Initial fetch on mount
  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  // Refresh when navigating to this page
  useEffect(() => {
    if (location.pathname === '/coupon&promo/list') {
      dispatch(fetchCoupons());
    }
  }, [location.pathname, dispatch]);

  // Debounce search and refetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchCoupons()); // In real app, pass search/filter params
    }, 400);
    return () => clearTimeout(timer);
  }, [dispatch, searchInput, statusFilter]);

  // Pagination logic - sort by newest first (createdAt descending)
  const sortedCoupons = [...coupons].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (dateA !== dateB) return dateB - dateA; // Newest first
    // Fallback to _id comparison
    return (b._id || '').localeCompare(a._id || '');
  });

  const total = sortedCoupons.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedCoupons = sortedCoupons
    .filter(
      (c) =>
        (!searchInput ||
          c.code.toLowerCase().includes(searchInput.toLowerCase())) &&
        (!statusFilter ||
          (statusFilter === "active" ? c.isActive : !c.isActive))
    )
    .slice((page - 1) * limit, page * limit);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };
  const handleResetFilters = () => {
    setSearchInput("");
    setStatusFilter("");
    setPage(1);
    setLimit(10);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxPages = 5;
    const start = Math.max(1, page - Math.floor(maxPages / 2));
    const end = Math.min(totalPages, start + maxPages - 1);
    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("...", totalPages);
    return pages;
  };

  const handleDeleteConfirm = async () => {
    if (couponToDelete && couponToDelete._id) {
      // Check if coupon is active
      if (couponToDelete.isActive) {
        setPopup({
          message: `Cannot delete active coupon "${couponToDelete.code}". Please set the coupon to inactive first.`,
          type: "error",
          isVisible: true,
        });
        closeDeleteModal();
        return;
      }

      setIsDeleting(true);
      try {
        // Dispatch the delete action
        await dispatch(deleteCoupon(couponToDelete._id)).unwrap();

        setPopup({
          message: `Coupon "${couponToDelete.code}" deleted successfully`,
          type: "success",
          isVisible: true,
        });

        // Close modal and reset state
        closeDeleteModal();

        // Refresh the coupons list
        dispatch(fetchCoupons());

        console.log(`Coupon "${couponToDelete.code}" deleted successfully`);
      } catch (error) {
        console.error("Failed to delete coupon:", error);
        setPopup({
          message: "Failed to delete coupon. Please try again.",
          type: "error",
          isVisible: true,
        });
        setIsDeleting(false);
      }
    }
  };
  const openDeleteModal = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setDeleteModalOpen(true);
  };
  return (
    <div>
      <PageMeta title="Coupons | TailAdmin" description="Manage coupons" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-gray-50/50 to-white dark:border-gray-800 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900 px-5 py-7 xl:px-10 xl:py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Coupons
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage promotional coupons and codes
            </p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6 rounded-2xl mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-indigo-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by code..."
                className="pl-12 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-900/50 dark:text-white transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-4 rounded-xl">
              <Filter className="h-5 w-5 text-indigo-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none px-3 py-3 focus:ring-0 dark:text-white cursor-pointer font-medium outline-none"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Show:
              </span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-transparent border-none px-3 py-3 focus:ring-0 dark:text-white cursor-pointer font-medium"
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

        {/* Table (styled like EditSubcategory) */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Expires At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Usage Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Used Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Min Cart Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 dark:bg-gray-900/30 divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-gray-400">
                      No coupons found.
                    </td>
                  </tr>
                ) : (
                  paginatedCoupons.map((coupon, idx) => (
                    <tr
                      key={coupon._id || coupon.code}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {coupon.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {coupon.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {coupon.value}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {coupon.isActive ? (
                          <CheckCircle className="text-green-500 h-5 w-5" />
                        ) : (
                          <XCircle className="text-red-500 h-5 w-5" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatExpiryDate(coupon)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {coupon.usageLimit}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {coupon.usedCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {coupon.minCartValue}
                      </td>
                      <td className="px-6 py-4 text-right flex  space-x-2">
                        <Link to={`/coupon&promo/edit/${coupon._id}`}>
                          <button className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shadow-sm hover:shadow-md">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDeleteModal(coupon)}
                          className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination (styled) */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm bg-white dark:bg-gray-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {generatePageNumbers().map((p, idx) =>
            typeof p === "number" ? (
              <button
                key={idx}
                onClick={() => handlePageChange(p)}
                className={`px-4 py-2 rounded-xl font-medium transition-all shadow-sm hover:shadow-md ${page === p
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                  }`}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-2 py-2 text-gray-400 dark:text-gray-500">
                {p}
              </span>
            )
          )}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm bg-white dark:bg-gray-800"
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

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        coupon={couponToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CouponList;
