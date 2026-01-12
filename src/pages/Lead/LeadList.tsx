import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  RotateCcw,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
  User,
  Pencil,
  Eye,
  UserPlus,
  Check,
  ChevronDown,
  FileText,
  PhoneCall,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchLeads,
  deleteLead,
  setSearchQuery,
  setFilters,
  resetFilters,
  assignLeads,
} from "../../store/slices/lead";
import { fetchStaff } from "../../store/slices/staff";
import { Lead } from "../../store/slices/lead";
import PageMeta from "../../components/common/PageMeta";
import PopupAlert from "../../components/popUpAlert";
import { initiateCall } from "../../services/callService";

// Helper function for status badges
const getStatusBadge = (status: string) => {
  const statusConfig = {
    new: {
      bg: "bg-blue-100 dark:bg-blue-900/20",
      text: "text-blue-800 dark:text-blue-200",
    },
    contacted: {
      bg: "bg-yellow-100 dark:bg-yellow-900/20",
      text: "text-yellow-800 dark:text-yellow-200",
    },
    qualified: {
      bg: "bg-purple-100 dark:bg-purple-900/20",
      text: "text-purple-800 dark:text-purple-200",
    },
    converted: {
      bg: "bg-green-100 dark:bg-green-900/20",
      text: "text-green-800 dark:text-green-200",
    },
    lost: {
      bg: "bg-red-100 dark:bg-red-900/20",
      text: "text-red-800 dark:text-red-200",
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.new;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {status?.charAt(0)?.toUpperCase() + status?.slice(1)}
    </span>
  );
};

// Lead Details Modal Component
const LeadDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}> = ({ isOpen, onClose, lead }) => {
  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-transparent backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Lead Details
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lead.fullName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Full Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {lead.fullName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {lead.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Phone
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {lead.phone}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Source
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {lead.source || "Not specified"}
                  </p>
                </div>
                {lead.company && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Company
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {lead.company}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </label>
                  <div className="mt-1">{getStatusBadge(lead.status)}</div>
                </div>
              </div>
            </div>

            {/* Assigned To */}
            {lead.assignedTo && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Assigned To
                </h4>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {lead.assignedTo.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {lead.assignedTo}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {lead.notes && lead.notes.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Notes
                </h4>
                <div className="space-y-3">
                  {lead.notes.map((note, index) => (
                    <div
                      key={note._id || index}
                      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <p className="text-sm text-gray-900 dark:text-white">
                        {note.note}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                Timeline
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created At
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(lead.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Updated
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(lead.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lead: Lead | null;
  isDeleting: boolean;
}> = ({ isOpen, onClose, onConfirm, lead, isDeleting }) => {
  if (!isOpen || !lead) return null;

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
                Delete Lead
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
              Are you sure you want to delete the lead{" "}
              {lead.fullName && (
                <strong className="text-gray-900 dark:text-white">
                  "{lead.fullName}"
                </strong>
              )}
              ?
            </p>
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

const LeadList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    leads = [],
    loading,
    error,
    pagination,
    searchQuery,
    filters,
  } = useAppSelector((state) => state.lead);
  const { staff, loading: staffLoading } = useAppSelector(
    (state) => state.staff
  );

  const search = new URLSearchParams(window.location.search);
  const searchQueryParam = search.get("lastcallstatus") || "";

  // convert searchQueryParam to actual valid string it add _ before capital letters also make it lowercase
  const validLastCallStatus = searchQueryParam
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase();
  console.log("last call status is ===> ", validLastCallStatus);
  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
  const userRoleId = userInfo?.role || "";
  const userId = userInfo?._id || "";
  const isSuperAdmin = userInfo?.isSuperAdmin || false;

  // Staff role ID
  const STAFF_ROLE_ID = "6892f49e5e1bb25c871bdd3c";

  // User is staff if their role matches the staff role ID
  const isStaff = userRoleId === STAFF_ROLE_ID && !isSuperAdmin;

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initiatingCall, setInitiatingCall] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [localFilters, setLocalFilters] = useState<Record<string, any>>({});

  // Popup state for alerts
  const [popup, setPopup] = useState({
    message: "",
    type: "success" as "success" | "error",
    isVisible: false,
  });

  // Status options for filter
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "lost", label: "Lost" },
  ];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        dispatch(setSearchQuery(searchInput));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, dispatch]);

  // Fetch leads
  useEffect(() => {
    const activeFilters = {
      ...(localFilters.status ? { status: localFilters.status } : {}),
      // If user is staff, automatically filter by their assigned leads
      ...(isStaff && userId ? { assignedTo: userId } : {}),
    };

    if (validLastCallStatus !== "" && validLastCallStatus !== "undefined") {
      activeFilters.lastCallStatus = validLastCallStatus;
    }

    dispatch(
      fetchLeads({
        page: pagination.page,
        limit: pagination.limit,
        filters: activeFilters,
        search: searchInput !== "" ? searchInput : undefined,
        sort: { createdAt: "desc" },
      })
    );
  }, [
    dispatch,
    pagination.page,
    pagination.limit,
    searchInput,
    localFilters,
    isStaff,
    userId,
  ]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      dispatch(
        fetchLeads({
          page: newPage,
          limit: pagination.limit,
          filters: {
            ...(localFilters.status ? { status: localFilters.status } : {}),
            ...(isStaff && userId ? { assignedTo: userId } : {}),
            ...(validLastCallStatus !== "" &&
            validLastCallStatus !== "undefined"
              ? { lastCallStatus: validLastCallStatus }
              : {}),
          },
          search: searchInput !== "" ? searchInput : undefined,
          sort: { createdAt: "desc" },
        })
      );
    }
  };

  const handleLimitChange = (newLimit: number) => {
    dispatch(
      fetchLeads({
        page: 1,
        limit: newLimit,
        filters: {
          ...(localFilters.status ? { status: localFilters.status } : {}),
          ...(isStaff && userId ? { assignedTo: userId } : {}),
          ...(validLastCallStatus !== "" && validLastCallStatus !== "undefined"
            ? { lastCallStatus: validLastCallStatus }
            : {}),
        },
        search: searchInput !== "" ? searchInput : undefined,
        sort: { createdAt: "desc" },
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

  const handleEditLead = (lead: Lead) => {
    navigate(`/lead/edit/${lead._id}`);
  };

  const handleViewNotes = (lead: Lead) => {
    navigate(`/lead/notes/${lead._id}`);
  };

  const openDeleteModal = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setLeadToDelete(null);
    setDeleteModalOpen(false);
    setIsDeleting(false);
  };

  const handleDeleteConfirm = async () => {
    if (leadToDelete) {
      setIsDeleting(true);
      try {
        // Dispatch the delete action
        await dispatch(deleteLead(leadToDelete._id)).unwrap();

        setPopup({
          message: `Lead "${leadToDelete.fullName}" deleted successfully`,
          type: "success",
          isVisible: true,
        });

        // Close modal and reset state
        closeDeleteModal();

        // Refresh the leads list
        const activeFilters = {
          ...(localFilters.status ? { status: localFilters.status } : {}),

          ...(isStaff && userId ? { assignedTo: userId } : {}),
          ...(validLastCallStatus !== "" && validLastCallStatus !== "undefined"
            ? { lastCallStatus: validLastCallStatus }
            : {}),
        };

        dispatch(
          fetchLeads({
            page: pagination.page,
            limit: pagination.limit,
            filters: activeFilters,
            search: searchInput !== "" ? searchInput : undefined,
            sort: { createdAt: "desc" },
          })
        );
      } catch (error) {
        console.error("Failed to delete lead:", error);
        setPopup({
          message: "Failed to delete lead. Please try again.",
          type: "error",
          isVisible: true,
        });
        setIsDeleting(false);
      }
    }
  };

  // Bulk assignment state
  const [isAssignMode, setIsAssignMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock staff data - replace with actual staff from your store/API
  const staffMembers = [
    { id: "staff1", name: "John Smith", email: "john@example.com" },
    { id: "staff2", name: "Sarah Johnson", email: "sarah@example.com" },
    { id: "staff3", name: "Mike Brown", email: "mike@example.com" },
    { id: "staff4", name: "Lisa Davis", email: "lisa@example.com" },
  ];

  // Fetch staff when component mounts
  useEffect(() => {
    dispatch(fetchStaff({}));
  }, [dispatch]);

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowStaffDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter staff based on search term
  const filteredStaff = staff.filter(
    (staffMember) =>
      staffMember.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
      staffMember.email.toLowerCase().includes(staffSearchTerm.toLowerCase())
  );

  // Get leads that can be assigned (only "new" status)
  const assignableLeads = leads.filter((lead) => lead.status === "new");

  // Bulk assignment handlers
  const toggleAssignMode = () => {
    setIsAssignMode(!isAssignMode);
    setSelectedLeads([]);
    setShowStaffDropdown(false);
    setStaffSearchTerm("");
  };

  const handleLeadSelection = (leadId: string) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === assignableLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(assignableLeads.map((lead) => lead._id));
    }
  };

  const handleStaffSelect = async (staffMember: {
    _id: string;
    name: string;
    email: string;
  }) => {
    if (selectedLeads.length === 0) {
      setPopup({
        message: "Please select at least one lead to assign",
        type: "error",
        isVisible: true,
      });
      return;
    }

    setIsAssigning(true);
    setShowStaffDropdown(false);

    try {
      await dispatch(
        assignLeads({
          leadIds: selectedLeads,
          assignedTo: staffMember._id,
        })
      ).unwrap();

      setPopup({
        message: `Successfully assigned ${selectedLeads.length} lead(s) to ${staffMember.name}`,
        type: "success",
        isVisible: true,
      });

      // Reset assignment mode
      setIsAssignMode(false);
      setSelectedLeads([]);
      setStaffSearchTerm("");

      // Refresh leads
      const activeFilters = {
        ...(localFilters.status ? { status: localFilters.status } : {}),
        ...(isStaff && userId ? { assignedTo: userId } : {}),
        ...(validLastCallStatus !== "" && validLastCallStatus !== "undefined"
          ? { lastCallStatus: validLastCallStatus }
          : {}),
      };

      dispatch(
        fetchLeads({
          page: pagination.page,
          limit: pagination.limit,
          filters: activeFilters,
          search: searchInput !== "" ? searchInput : undefined,
          sort: { createdAt: "desc" },
        })
      );
    } catch (error: any) {
      console.log("Failed to assign leads:", error?.message || error);
      setPopup({
        message: "Failed to assign leads. Please try again.",
        type: "error",
        isVisible: true,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStaffSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStaffSearchTerm(e.target.value);
    setShowStaffDropdown(true);
  };

  const handleInitiateCall = async (leadId: string) => {
    if (!leadId) {
      toast.error("Lead ID is required to initiate a call");
      return;
    }

    setInitiatingCall(leadId);
    try {
      // Get current user to ensure call connects to them
      let agentId = undefined;
      let agentNumber = undefined;
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          agentId = user._id || user.id;
          // Fallback to user-provided number if missing in profile
          agentNumber = user.phone || user.phoneNumber || user.mobile || "9824853820";
        } else {
          // Fallback even if no user found (though unlikely for logged in app)
         
        }
      } catch (e) {
        console.warn("Could not retrieve current user for call initiation", e);
       
      }

      const response = await initiateCall(leadId, agentId, agentNumber);
      toast.success(response.message || "Call initiated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate call");
      console.error("Error initiating call:", error);
    } finally {
      setInitiatingCall(null);
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

  // Generate avatar initials from full name
  const getAvatarInitials = (fullName: string) => {
    if (!fullName || typeof fullName !== "string") {
      return "NA";
    }
    return fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div>
      <PageMeta
        title="Lead List | TailAdmin"
        description="List of all leads in TailAdmin"
      />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Lead List
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm dark:text-gray-400">
              Total: {pagination.total}
            </span>

            {/* Show Assign Leads button only if there are assignable leads */}
            {assignableLeads.length > 0 && (
              <button
                onClick={toggleAssignMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isAssignMode
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-indigo-500 text-white hover:bg-indigo-600"
                }`}
              >
                {isAssignMode ? (
                  <>
                    <X className="w-4 h-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Assign Leads ({assignableLeads.length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bulk Assignment Controls */}
        {isAssignMode && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                  {selectedLeads.length} of {assignableLeads.length} assignable
                  lead(s) selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                >
                  {selectedLeads.length === assignableLeads.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              {selectedLeads.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={staffSearchTerm}
                      onChange={handleStaffSearchChange}
                      onFocus={() => setShowStaffDropdown(true)}
                      placeholder={
                        staffLoading
                          ? "Loading staff..."
                          : "Search staff to assign..."
                      }
                      className="w-64 rounded border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      disabled={staffLoading || isAssigning}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      {isAssigning ? (
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Search className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {showStaffDropdown && !staffLoading && !isAssigning && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 max-h-60 overflow-y-auto">
                      {filteredStaff.length > 0 ? (
                        filteredStaff.map((staffMember) => (
                          <button
                            key={staffMember._id}
                            onClick={() => handleStaffSelect(staffMember)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-3"
                          >
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                {staffMember.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {staffMember.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {staffMember.email}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {staffSearchTerm
                            ? "No staff members found"
                            : "Type to search staff"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white shadow p-4 rounded-md mb-6 dark:bg-gray-900">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={localFilters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Limit */}
            <div className="flex items-center gap-2">
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
            </div>

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
                {isAssignMode && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedLeads.length === assignableLeads.length &&
                        assignableLeads.length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  Avatar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  last Call Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-900 dark:divide-gray-800">
              {!leads || leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAssignMode ? 9 : 8}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <User className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p>No leads found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (leads || []).map((lead, idx) => (
                  <tr
                    key={lead._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {isAssignMode && (
                      <td className="px-6 py-4">
                        {lead.status === "new" ? (
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead._id)}
                            onChange={() => handleLeadSelection(lead._id)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                        ) : (
                          <div className="w-4 h-4 flex items-center justify-center">
                            <span className="text-xs text-gray-400">N/A</span>
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {getAvatarInitials(lead.fullName || "")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {lead.fullName || "No Name"}
                      {lead.company && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {lead.company}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {lead.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {lead.phone}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(lead.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {lead.source || "Not specified"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {lead.lastCallStatus}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {!isAssignMode && (
                        <>
                          <button
                            onClick={() => handleEditLead(lead)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            title="Edit Lead"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleViewNotes(lead)}
                            className="text-purple-500 hover:text-purple-700 transition-colors"
                            title="View Notes"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleInitiateCall(lead._id)}
                            className="text-green-500 hover:text-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Initiate Call"
                            disabled={initiatingCall === lead._id}
                          >
                            {initiatingCall === lead._id ? (
                              <div className="w-5 h-5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin"></div>
                            ) : (
                              <PhoneCall className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => openDeleteModal(lead)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                className={`px-3 py-1 rounded ${
                  pagination.page === page
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
        lead={leadToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default LeadList;
